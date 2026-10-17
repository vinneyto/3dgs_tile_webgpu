import { describe, expect, it, vi } from "vitest";
import {
  Group,
  Matrix4,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
} from "three/webgpu";
import { float, vec3 } from "three/tsl";
import { GaussianCloudMaterial } from "../src/renderer/GaussianCloudMaterial";
import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianCloud } from "../src/renderer/GaussianCloud";
import {
  gaussianColor,
  gaussianPositionLocal,
  rasterUV,
  createDefaultGaussianNodeSlots,
} from "../src/renderer/nodes/GaussianContextNodes";
import { CloudAccumulationStage } from "../src/renderer/pipeline/CloudAccumulationStage";
import { CloudSource } from "../src/renderer/pipeline/CloudSource";
import { FrameUniforms } from "../src/renderer/pipeline/FrameUniforms";
import { StorageBindings } from "../src/renderer/pipeline/StorageBindings";
import { packedStore } from "./helpers/packedStore";
import { buildCompute } from "./helpers/buildCompute";

describe("per-cloud accumulation", () => {
  it("gathers sparse active slots into separate local buffers without cloud ids", () => {
    const fixture = packedStore(model(3));
    const second = fixture.add(model(2));
    const data = fixture.store.getPackedData();
    // Transport ownership can be sparse and need not match cloud order.
    const values = data.means.array;
    for (const [slot, owner] of [1, -1, 0, 1, 0].entries()) {
      values[slot * 4] = 10 + slot;
      values[slot * 4 + 3] = owner;
    }
    new Scene().add(fixture.cloud, second);
    const stage = createStage(fixture.store);
    stage.prepare();
    const first = stage.dispatches.get(fixture.cloud)!;
    const other = stage.dispatches.get(second)!;
    expect(Array.from(first.source.buffers.means.array).slice(0, 8)).toEqual([
      12,
      0,
      -3,
      encoded(2),
      14,
      0,
      -3,
      encoded(4),
    ]);
    expect(Array.from(other.source.buffers.means.array).slice(0, 8)).toEqual([
      10,
      0,
      -3,
      encoded(0),
      13,
      0,
      -3,
      encoded(3),
    ]);
    expect(first.offset.value).toBe(0);
    expect(other.offset.value).toBe(2);
    expect(stage.count).toBe(4);
    expect(first.source.buffers.means).not.toBe(other.source.buffers.means);
    for (const node of stage.getComputeNodes()) {
      const source = buildCompute(node);
      expect(source).toContain("gaussian_view_covariance");
      expect(source).toContain("evaluate_gaussian_sh");
      expect(source).not.toContain("gaussianObjectId");
      expect(source.match(/var<storage/g)).toHaveLength(5);
    }
    stage.dispose();
    fixture.store.dispose();
  });

  it("uses committed active slots and handles an empty cut", () => {
    const f = packedStore(model(4));
    const packed = f.store.getPackedData();
    const data = new GaussianData(packed, {
      count: 4,
      shFormat: packed.shFormat,
      activeSlots: new Uint32Array([3, 1]),
    });
    new Scene().add(f.cloud);
    const stage = createStage(f.store, new PerspectiveCamera(), data);
    stage.prepare();
    expect(stage.count).toBe(2);
    data.stageActivation(new Uint32Array([2]), new Uint32Array([3]), false);
    stage.prepare();
    expect(stage.count).toBe(2);
    expect(stage.dispatches.get(f.cloud)!.source.buffers.means.array[3]).toBe(
      encoded(3),
    );
    data.stageActivation(new Uint32Array(), new Uint32Array(), true);
    stage.prepare();
    expect(stage.dispatches.get(f.cloud)!.source.buffers.means.array[3]).toBe(
      encoded(1),
    );
    data.stageActivation(new Uint32Array(), new Uint32Array([1, 2]), true);
    stage.prepare();
    expect(stage.count).toBe(0);
    const renderer = { compute: vi.fn() };
    stage.encode(renderer as never);
    expect(renderer.compute).not.toHaveBeenCalled();
    stage.dispose();
    data.dispose();
    f.store.dispose();
  });

  it("updates world transforms and excludes hidden, detached and camera-layer clouds", () => {
    const f = packedStore(model(2));
    const second = f.add(model(1));
    const scene = new Scene(),
      group = new Group();
    scene.add(group, second);
    group.add(f.cloud);
    group.position.x = 3;
    group.scale.set(2, 3, 4);
    f.cloud.position.y = 2;
    const camera = new PerspectiveCamera();
    const stage = createStage(f.store, camera);
    const layout = f.store.layoutVersion;
    stage.prepare();
    const dispatch = stage.dispatches.get(f.cloud)!;
    expect(dispatch.matrixWorld.value.elements).toEqual(
      new Matrix4().makeScale(2, 3, 4).setPosition(3, 6, 0).elements,
    );
    const kernel = dispatch.compute;
    group.visible = false;
    stage.prepare();
    expect(stage.count).toBe(1);
    expect(stage.dispatches.get(second)!.offset.value).toBe(0);
    group.visible = true;
    group.remove(f.cloud);
    stage.prepare();
    expect(stage.count).toBe(1);
    group.add(f.cloud);
    f.cloud.layers.set(1);
    stage.prepare();
    expect(stage.count).toBe(1);
    camera.layers.enable(1);
    stage.prepare();
    expect(stage.count).toBe(3);
    expect(dispatch.compute).toBe(kernel);
    expect(f.store.layoutVersion).toBe(layout);
    stage.dispose();
    f.store.dispose();
  });

  it("isolates cameras and material dispatches even when the material is shared", () => {
    const f = packedStore(model(1));
    const second = f.add(model(1));
    new Scene().add(f.cloud, second);
    const material = new GaussianCloudMaterial();
    material.positionLocalNode = gaussianPositionLocal.add(vec3(1, 2, 3));
    material.colorNode = gaussianColor.mul(vec3(0.25, 0.5, 1));
    f.cloud.material = second.material = material;
    const leftCamera = new PerspectiveCamera(),
      rightCamera = new PerspectiveCamera();
    leftCamera.position.x = -2;
    rightCamera.position.x = 3;
    const left = createStage(f.store, leftCamera),
      right = createStage(f.store, rightCamera);
    left.prepare();
    right.prepare();
    const a = left.dispatches.get(f.cloud)!,
      b = right.dispatches.get(f.cloud)!;
    expect(a.compute).not.toBe(b.compute);
    expect(a.cameraLocal.value.x).toBe(-2);
    expect(b.cameraLocal.value.x).toBe(3);
    expect(left.attribute).not.toBe(right.attribute);
    const source = buildCompute(a.compute);
    expect(source).toContain("vec3<f32>( 1.0, 2.0, 3.0 )");
    expect(source).toContain("vec3<f32>( 0.25, 0.5, 1.0 )");
    const previous = a.compute,
      other = left.dispatches.get(second)!.compute;
    f.cloud.material = new GaussianCloudMaterial();
    left.prepare();
    expect(a.compute).not.toBe(previous);
    expect(left.dispatches.get(second)!.compute).toBe(other);
    const rebuilt = a.compute;
    f.cloud.material.opacityNode = float(0.4);
    f.cloud.material.needsUpdate = true;
    left.prepare();
    expect(a.compute).not.toBe(rebuilt);
    left.dispose();
    right.dispose();
    f.store.dispose();
  });

  it("retires removed cloud inputs and ignores a new cloud without committed slots", () => {
    const f = packedStore(model(1));
    new Scene().add(f.cloud);
    const stage = createStage(f.store);
    stage.prepare();
    const disposed = vi.fn();
    stage.dispatches
      .get(f.cloud)!
      .source.buffers.means.addEventListener("dispose", disposed);
    const extra = new GaussianCloud(f.store, 999, 0);
    new Scene().add(extra);
    vi.spyOn(f.store, "clouds", "get").mockReturnValue([extra]);
    stage.prepare();
    expect(disposed).toHaveBeenCalledOnce();
    expect(stage.count).toBe(0);
    expect(stage.dispatches.has(f.cloud)).toBe(false);
    stage.dispose();
    f.store.dispose();
  });

  it("retains bindings through count growth and updates only changed source spans", () => {
    const source = new CloudSource(new StorageBindings());
    const data = model(3);
    source.update(data, [0, 1]);
    const means = source.buffers.means;
    means.clearUpdateRanges();
    source.update(data, [0, 1]);
    expect(means.updateRanges).toHaveLength(0);
    data.means.array[4] = 9;
    source.update(data, [0, 1]);
    expect(means.updateRanges).toEqual([{ start: 4, count: 4 }]);
    source.update(data, [0, 1, 2]);
    expect(source.buffers.means).not.toBe(means);
    expect(source.buffers.means.array[4]).toBe(9);
    source.dispose();
    data.dispose();
  });

  it("does not upload retained inputs when backend active ordinals are reordered", () => {
    const source = new CloudSource(new StorageBindings());
    const data = model(3);
    source.update(data, [0, 1, 2]);
    for (const attr of Object.values(source.buffers)) attr.clearUpdateRanges();
    source.update(data, [2, 0, 1]);
    for (const attr of Object.values(source.buffers))
      expect(attr.updateRanges).toHaveLength(0);
    source.dispose();
    data.dispose();
  });

  it("rejects raster-only accessors in cloud materials", () => {
    const f = packedStore(model(1));
    f.cloud.material.colorNode = vec3(rasterUV, 1);
    const stage = createStage(f.store);
    expect(() => {
      stage.prepare();
      stage.getComputeNodes().forEach(buildCompute);
    }).toThrow(/accessor|not available/);
    stage.dispose();
    f.store.dispose();
  });
});

function createStage(
  store: ReturnType<typeof packedStore>["store"],
  camera = new PerspectiveCamera(),
  data = store.getPackedData(),
) {
  return new CloudAccumulationStage(
    camera,
    store,
    data,
    new FrameUniforms(camera, [0, 0, 0, 0]),
    createDefaultGaussianNodeSlots(),
  );
}

function model(count: number): GaussianData {
  const attribute = (values: Float32Array) =>
    new StorageBufferAttribute(values, 4);
  return new GaussianData(
    {
      means: attribute(
        new Float32Array(
          Array.from({ length: count }, (_, i) => [i, 0, -3, 0]).flat(),
        ),
      ),
      scalesOpacity: attribute(
        new Float32Array(
          Array.from({ length: count }, () => [1, 2, 3, 1]).flat(),
        ),
      ),
      rotations: attribute(
        new Float32Array(
          Array.from({ length: count }, () => [0, 0, 0, 1]).flat(),
        ),
      ),
      shCoefficients: attribute(new Float32Array(count * 4)),
    },
    { count },
  );
}

function encoded(slot: number): number {
  return new Float32Array(new Uint32Array([slot ^ 0x3f800000]).buffer)[0]!;
}
