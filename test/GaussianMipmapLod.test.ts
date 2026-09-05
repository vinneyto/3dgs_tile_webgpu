import { describe, expect, it, vi } from "vitest";
import {
  Matrix4,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  StorageBufferAttribute,
  Vector3,
} from "three/webgpu";
import {
  GaussianData,
  GaussianLod,
  GaussianMipmapLod,
  GaussianOctree,
  GaussianStore,
  ScreenSpaceLodPackingStrategy,
  unpackShRgb8e8,
} from "../src/index";
import { diagonalize } from "../src/mipmap/buildMipmap";
import { selectMipmap, type MipmapView } from "../src/mipmap/selectMipmap";

const limits = { maxBufferSize: 1 << 28, maxStorageBufferBindingSize: 1 << 28 };
function data(count = 64): GaussianData {
  const means = new Float32Array(count * 4),
    scales = new Float32Array(count * 4),
    rotations = new Float32Array(count * 4),
    sh = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    means.set([(i % 8) * 0.01, Math.floor(i / 8) * 0.01, 0, 0], i * 4);
    scales.set([0.004, 0.002, 0.001, 0.4], i * 4);
    rotations[i * 4 + 3] = 1;
    sh.set([i % 2 ? 1 : 0, 0.2, 0.1, 0], i * 4);
  }
  return new GaussianData(
    {
      means: new StorageBufferAttribute(means, 4),
      scalesOpacity: new StorageBufferAttribute(scales, 4),
      rotations: new StorageBufferAttribute(rotations, 4),
      shCoefficients: new StorageBufferAttribute(sh, 4),
    },
    { count, ownsBuffers: true },
  );
}
function lod(count = 64) {
  return GaussianMipmapLod.build(
    GaussianOctree.build(data(count), { ownsData: true }),
    { ownsOctree: true },
  );
}
function view(distance: number, pixels = 4, height = 1000): MipmapView {
  const camera = new PerspectiveCamera(60, 1, 0.01, 1e6);
  camera.position.z = distance;
  camera.updateMatrixWorld();
  return {
    matrix: camera.matrixWorldInverse.toArray(),
    projection: camera.projectionMatrix.toArray(),
    width: height,
    height,
    pixelSize: pixels,
    perspective: true,
  };
}
function covariance(
  scales: ArrayLike<number>,
  quaternion: ArrayLike<number>,
): number[] {
  const r = new Matrix4().makeRotationFromQuaternion(
    new Quaternion().fromArray(quaternion),
  ).elements;
  return Array.from({ length: 9 }, (_, j) =>
    [0, 1, 2].reduce(
      (sum, k) =>
        sum +
        r[k * 4 + Math.floor(j / 3)]! * r[k * 4 + (j % 3)]! * scales[k]! ** 2,
      0,
    ),
  );
}

describe("Gaussian mipmap LOD", () => {
  it("reconstructs anisotropic rotated covariance including off-diagonal terms", () => {
    const original = covariance(
      [0.4, 0.02, 0.1],
      new Quaternion()
        .setFromAxisAngle(new Vector3(1, 2, 3).normalize(), 0.83)
        .toArray(),
    );
    const eigen = diagonalize(original);
    const restored = covariance(eigen.scales, eigen.rotation);
    restored.forEach((value, i) => expect(value).toBeCloseTo(original[i]!, 10));
  });

  it("merges moments and SH, preserves originals, and restores every original at finest detail", () => {
    const l = lod(2),
      t = l.tree;
    const parent = t.indices[t.offsets[0]!]!,
      o = parent * 4;
    expect(t.means[o]).toBeCloseTo(0.005);
    const c = covariance(
      t.scales.subarray(o, o + 3),
      t.rotations.subarray(o, o + 4),
    );
    expect(c[0]).toBeCloseTo(0.004 ** 2 + 0.005 ** 2, 10);
    expect(c[4]).toBeCloseTo(0.002 ** 2, 10);
    expect(unpackShRgb8e8(t.sh[parent]!)[0]).toBeCloseTo(0.5, 2);
    expect(Array.from(t.means.subarray(0, 8))).toEqual(
      Array.from(l.octree.data.means.array),
    );
    const cut = selectMipmap(t, view(0.05, 0.01), 2);
    expect(
      Array.from(
        l.indicesForPacking({
          ...cut,
          lodLevels: new Uint8Array(cut.nodeIds.length),
        }),
      ).sort(),
    ).toEqual([0, 1]);
    l.dispose();
  });

  it("returns a complete, non-overlapping hierarchy cut under every positive budget", () => {
    const l = lod();
    for (let budget = 1; budget <= 64; budget++) {
      const cut = selectMipmap(l.tree, view(0.1, 0.01), budget);
      expect(cut.gaussianCount).toBeLessThanOrEqual(budget);
      expect(cut.gaussianCount).toBeGreaterThan(0);
      const selected = new Set(cut.nodeIds);
      const visit = (id: number, ancestors: number): void => {
        const coverage = ancestors + Number(selected.has(id));
        if (l.tree.left[id]! < 0) expect(coverage).toBe(1);
        else {
          visit(l.tree.left[id]!, coverage);
          visit(l.tree.right[id]!, coverage);
        }
      };
      visit(0, 0);
    }
    expect(selectMipmap(l.tree, view(1), 0).gaussianCount).toBe(0);
    l.dispose();
  });

  it("refines with zoom/resolution/pixel threshold, without dropping coverage on rotation", () => {
    const l = lod(1024);
    const coarse = selectMipmap(l.tree, view(100), 1024).gaussianCount;
    const near = selectMipmap(l.tree, view(1), 1024).gaussianCount;
    expect(coarse).toBeLessThan(near);
    expect(
      selectMipmap(l.tree, view(1, 1), 1024).gaussianCount,
    ).toBeGreaterThanOrEqual(near);
    expect(
      selectMipmap(l.tree, view(1, 4, 2000), 1024).gaussianCount,
    ).toBeGreaterThanOrEqual(near);
    const rotated = view(1);
    rotated.matrix = new Matrix4()
      .makeRotationY(1.2)
      .multiply(new Matrix4().fromArray(rotated.matrix))
      .toArray();
    expect(selectMipmap(l.tree, rotated, 1024)).toEqual(
      selectMipmap(l.tree, view(1), 1024),
    );
    l.dispose();
  });

  it("updates Store atomically and reuses allocations when returning to originals", () => {
    const l = lod(),
      store = new GaussianStore();
    const cloud = store.addLod(l, { ownsLod: true });
    store.pack({ limits });
    const version = store.layoutVersion;
    const camera = new PerspectiveCamera(60, 1, 0.001, 1e6);
    camera.position.z = 100;
    store.updateLod(camera, 1000, 1000);
    expect(cloud.gaussianCount).toBe(1);
    camera.position.z = 0.1;
    store.updateLod(camera, 1000, 1000);
    expect(cloud.gaussianCount).toBe(64);
    expect(store.layoutVersion).toBe(version);
    expect(store.lastPackStats?.activeGaussians).toBe(64);
    const active = Array.from(
      store.getPackedData().scalesOpacity.array as Float32Array,
    ).filter(
      (_, i) =>
        i % 4 === 3 &&
        (store.getPackedData().scalesOpacity.array[i] as number) > 0,
    );
    expect(active).toHaveLength(64);
    camera.position.z = 100;
    store.updateLod(camera, 1000, 1000);
    expect(cloud.gaussianCount).toBe(1);
    expect(store.lastPackStats?.clearedSlots).toBeGreaterThan(0);
    store.dispose();
  });

  it("supports orthographic zoom and cloud transforms", () => {
    const l = lod(),
      strategy = new ScreenSpaceLodPackingStrategy();
    strategy.pack({ lod: l, maxGaussians: 64 });
    const camera = new OrthographicCamera(-100, 100, 100, -100, 0.1, 1000),
      object = new Object3D();
    camera.position.z = 10;
    strategy.setViewport(1000, 1000).setFromCamera(camera, object);
    strategy.update();
    expect(strategy.pack({ lod: l, maxGaussians: 64 }).gaussianCount).toBe(1);
    camera.zoom = 1000;
    camera.updateProjectionMatrix();
    strategy.setFromCamera(camera, object);
    strategy.update();
    expect(strategy.pack({ lod: l, maxGaussians: 64 }).gaussianCount).toBe(64);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    object.scale.setScalar(1000);
    strategy.setFromCamera(camera, object);
    strategy.update();
    expect(strategy.pack({ lod: l, maxGaussians: 64 }).gaussianCount).toBe(64);
    strategy.dispose();
    l.dispose();
  });

  it("raycasts merged attributes in rendered mode and source attributes in full mode", () => {
    const l = lod(),
      store = new GaussianStore(),
      cloud = store.addLod(l, { ownsLod: true });
    store.pack({ limits });
    cloud.raycastAlphaThreshold = 0.01;
    const caster = new Raycaster(
      new Vector3(0.035, 0.035, 1),
      new Vector3(0, 0, -1),
    );
    const hits = caster.intersectObject(cloud);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.index).toBeGreaterThanOrEqual(64);
    cloud.raycastMode = "full";
    expect(caster.intersectObject(cloud).every((h) => h.index! < 64)).toBe(
      true,
    );
    store.dispose();
  });

  it("rejects ancestor/child overlap and invalid build/selection parameters", () => {
    const l = lod();
    expect(() =>
      l.indicesForPacking({
        nodeIds: Uint32Array.of(0, 1),
        lodLevels: Uint8Array.of(0, 0),
        gaussianCount: 2,
      }),
    ).toThrow(/ancestor/);
    expect(() => GaussianMipmapLod.build(l.octree, { leafSize: 0 })).toThrow(
      /leafSize/,
    );
    expect(() => new ScreenSpaceLodPackingStrategy({ pixelSize: NaN })).toThrow(
      /pixelSize/,
    );
    l.dispose();
  });

  it("ignores asynchronous results from an obsolete budget and terminates owned workers", () => {
    const workers: FakeWorker[] = [];
    class FakeWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: ((event: { message: string }) => void) | null = null;
      messages: unknown[] = [];
      terminate = vi.fn();
      constructor() {
        workers.push(this);
      }
      postMessage(message: unknown) {
        this.messages.push(message);
      }
      result(selection: { nodeIds: Uint32Array; gaussianCount: number }) {
        this.onmessage?.({ data: { selection, planningMs: 1 } });
      }
    }
    const l = lod();
    vi.stubGlobal("Worker", FakeWorker);
    try {
      const strategy = new ScreenSpaceLodPackingStrategy();
      strategy.pack({ lod: l, maxGaussians: 64 });
      const camera = new PerspectiveCamera(60, 1, 0.001, 1e6);
      camera.position.z = 0.1;
      strategy.setViewport(1000, 1000).setFromCamera(camera, new Object3D());
      strategy.update();
      expect(strategy.pending).toBe(true);
      expect(strategy.pack({ lod: l, maxGaussians: 1 }).gaussianCount).toBe(1);
      const finest = selectMipmap(l.tree, view(0.1, 0.01), 64);
      workers[0]!.result(finest);
      strategy.update();
      expect(strategy.pack({ lod: l, maxGaussians: 1 }).gaussianCount).toBe(1);
      workers[0]!.result({ nodeIds: Uint32Array.of(0), gaussianCount: 1 });
      strategy.update();
      strategy.dispose();
      expect(workers[0]!.terminate).toHaveBeenCalledOnce();
      const store = new GaussianStore();
      store.addLod(l);
      store.pack({ limits });
      store.dispose();
      expect(workers[1]!.terminate).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
      l.dispose();
    }
  });

  it("keeps legacy loading available and adds opt-in asynchronous mipmap loading", async () => {
    const store = new GaussianStore({ loader: { load: async () => data() } });
    const legacy = await store.load("legacy.ply"),
      mipmap = await store.load("mipmap.ply", { mipmap: {} });
    expect(legacy.lod).toBeInstanceOf(GaussianLod);
    expect(legacy.lod).not.toBeInstanceOf(GaussianMipmapLod);
    expect(mipmap.lod).toBeInstanceOf(GaussianMipmapLod);
    store.dispose();
  });
});
