import { afterEach, describe, expect, it, vi } from "vitest";
import { StorageBufferAttribute, Vector3 } from "three/webgpu";

import { GaussianData } from "../src/GaussianData";
import { GaussianLod } from "../src/GaussianLod";
import {
  DistanceAwareLodWorkerPlanner,
  DistanceAwareRadialLodPackingStrategy,
} from "../src/lod-packing";
import type {
  DistanceAwareLodWorkerBufferSet,
  DistanceAwareLodWorkerInitMessage,
  DistanceAwareLodWorkerMessage,
  DistanceAwareLodWorkerRequestMessage,
  DistanceAwareLodWorkerResultMessage,
} from "../src/lod-packing/DistanceAwareLodWorkerProtocol";
import { GaussianOctree } from "../src/GaussianOctree";

describe("DistanceAwareLodWorkerPlanner", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeWorker.instances.length = 0;
  });

  it("keeps one in-flight request, replaces the queued target, and recycles both results", () => {
    vi.stubGlobal("Worker", FakeWorker);
    const lod = twoLeafLod();
    const targetStrategy = new DistanceAwareRadialLodPackingStrategy({
      center: new Vector3(),
    });
    const planner = new DistanceAwareLodWorkerPlanner(targetStrategy);
    planner.initialize(lod);
    const worker = FakeWorker.instances[0]!;
    const context = { lod, maxGaussians: 4 };

    planner.request(context);
    targetStrategy.setCenter(new Vector3(1, 0, 0));
    planner.request(context);
    targetStrategy.setCenter(new Vector3(2, 0, 0));
    planner.request(context);

    expect(worker.requests.map(({ revision }) => revision)).toEqual([1]);
    const init = worker.init!;
    expect(init.buffers).toHaveLength(2);
    worker.emitResult({
      type: "result",
      revision: 1,
      length: 0,
      gaussianCount: 0,
      planningMs: 1,
      buffer: init.buffers[0]!,
    });

    expect(worker.requests.map(({ revision }) => revision)).toEqual([1, 3]);
    expect(planner.discardedResults).toBe(2);
    const packing = packingAtLevel(lod, 0);
    const resultBuffer = init.buffers[1]!;
    new Uint32Array(resultBuffer.nodeIds).set(packing.nodeIds);
    new Uint8Array(resultBuffer.lodLevels).set(packing.lodLevels);
    worker.emitResult({
      type: "result",
      revision: 3,
      length: packing.nodeIds.length,
      gaussianCount: packing.gaussianCount,
      planningMs: 2,
      buffer: resultBuffer,
    });

    expect(planner.pending).toBe(false);
    expect(planner.hasResult).toBe(true);
    const target = planner.takeLatest()!;
    expect(Array.from(target.packing.nodeIds)).toEqual(
      Array.from(packing.nodeIds),
    );
    expect(target.planningMs).toBe(2);
    target.release();
    expect(worker.recycled).toHaveLength(2);
    planner.dispose();
    expect(worker.terminated).toBe(true);
  });
});

class FakeWorker {
  static readonly instances: FakeWorker[] = [];

  init: DistanceAwareLodWorkerInitMessage | null = null;
  readonly requests: DistanceAwareLodWorkerRequestMessage[] = [];
  readonly recycled: DistanceAwareLodWorkerBufferSet[] = [];
  terminated = false;
  private messageListener:
    | ((event: MessageEvent<DistanceAwareLodWorkerResultMessage>) => void)
    | null = null;

  constructor() {
    FakeWorker.instances.push(this);
  }

  addEventListener(
    type: string,
    listener: (
      event: MessageEvent<DistanceAwareLodWorkerResultMessage>,
    ) => void,
  ): void {
    if (type === "message") this.messageListener = listener;
  }

  removeEventListener(): void {}

  postMessage(message: DistanceAwareLodWorkerMessage): void {
    if (message.type === "init") this.init = message;
    else if (message.type === "request") this.requests.push(message);
    else this.recycled.push(message.buffer);
  }

  emitResult(message: DistanceAwareLodWorkerResultMessage): void {
    this.messageListener?.({ data: message } as MessageEvent);
  }

  terminate(): void {
    this.terminated = true;
  }
}

function twoLeafLod(): GaussianLod {
  const means = new Float32Array([
    -1, -1, -1, 0, -0.9, -0.9, -0.9, 0, 1, 1, 1, 0, 0.9, 0.9, 0.9, 0,
  ]);
  const scalesOpacity = new Float32Array(16);
  const rotations = new Float32Array(16);
  const shCoefficients = new Float32Array(16);
  for (let index = 0; index < 4; index++) {
    scalesOpacity.set([0.1, 0.1, 0.1, 1], index * 4);
    rotations[index * 4 + 3] = 1;
  }
  const data = new GaussianData(
    {
      means: attribute(means),
      scalesOpacity: attribute(scalesOpacity),
      rotations: attribute(rotations),
      shCoefficients: attribute(shCoefficients),
    },
    { count: 4 },
  );
  return GaussianLod.build(GaussianOctree.build(data, { leafCapacity: 2 }), {
    levels: [{ retention: 0.5 }, { retention: 1 }],
  });
}

function packingAtLevel(lod: GaussianLod, level: number) {
  const nodeIds = lod.octree.leafNodeIds.slice();
  return {
    nodeIds,
    lodLevels: new Uint8Array(nodeIds.length).fill(level),
    gaussianCount: Array.from(nodeIds).reduce(
      (sum, nodeId) => sum + lod.nodes[nodeId]!.levelCounts[level]!,
      0,
    ),
  };
}

function attribute(values: Float32Array): StorageBufferAttribute {
  return new StorageBufferAttribute(values, 4);
}
