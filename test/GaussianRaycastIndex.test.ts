import { beforeAll, describe, expect, it } from "vitest";
import { Ray, Raycaster, Vector3 } from "three/webgpu";
import {
  GaussianCloud,
  type GaussianCloudOwner,
} from "../src/renderer/GaussianCloud";
import { GaussianRaycastIndex } from "../src/renderer/GaussianRaycastIndex";
import { GaussianEngine } from "../src/wasm-backend/generated/gaussian_backend";
import type { BackendPayload } from "../src/streaming-backend/payloads/BackendPayload";
import type { MipmapSnapshot } from "../src/streaming-backend/MipmapSnapshot";
import { initializeTestWasm } from "./helpers/wasm";
beforeAll(initializeTestWasm);
function snapshot(maxLeaves: number): MipmapSnapshot {
  const names = [
    "x",
    "y",
    "z",
    "f_dc_0",
    "f_dc_1",
    "f_dc_2",
    "opacity",
    "scale_0",
    "scale_1",
    "scale_2",
    "rot_0",
    "rot_1",
    "rot_2",
    "rot_3",
  ];
  const header = new TextEncoder().encode(
    [
      "ply",
      "format binary_little_endian 1.0",
      "element vertex 2",
      ...names.map((name) => `property float ${name}`),
      "end_header",
      "",
    ].join("\n"),
  );
  const bytes = new Uint8Array(header.length + 2 * names.length * 4);
  bytes.set(header);
  const view = new DataView(bytes.buffer);
  [-2, 2].forEach((x, row) =>
    [x, 0, 0, 0, 0, 0, 10, -1, -1, -1, 1, 0, 0, 0].forEach((value, column) =>
      view.setFloat32(
        header.length + (row * names.length + column) * 4,
        value,
        true,
      ),
    ),
  );
  const engine = new GaussianEngine({});
  try {
    const payloads = engine.apply(
      {
        type: "load-cloud-from-buffer",
        cloudId: "test",
        options: { mipmaps: { type: "standard", snapshot: { maxLeaves } } },
      },
      bytes,
    ) as BackendPayload[];
    const loaded = payloads.find((payload) => payload.type === "cloud-loaded");
    if (loaded?.type !== "cloud-loaded" || !loaded.mipmapSnapshot)
      throw new Error("Missing snapshot");
    return loaded.mipmapSnapshot;
  } finally {
    engine.free();
  }
}
describe("synchronous mipmap raycast", () => {
  it("traverses bounds and intersects only frontier leaves", () => {
    const tree = snapshot(2);
    expect(tree.nodeCount).toBe(3);
    expect(tree.leafCount).toBe(2);
    const index = new GaussianRaycastIndex(tree);
    expect(
      index.raycast(new Ray(new Vector3(0, 0, 3), new Vector3(0, 0, -1)), 0.2),
    ).toBeNull();
    const hit = index.raycast(
      new Ray(new Vector3(-2, 0, 3), new Vector3(0, 0, -1)),
      0.2,
    );
    expect(hit?.gaussianIndex).not.toBe(0);
    expect(hit?.distance).toBeCloseTo(3 - Math.exp(-1), 2);
  });
  it("exports a complete coarser cut within maxLeaves", () => {
    const tree = snapshot(1);
    expect(tree.nodeCount).toBe(1);
    expect(tree.leafCount).toBe(1);
    expect(new GaussianRaycastIndex(tree).debugCells()).toHaveLength(1);
  });
  it("uses world distances under nonuniform scale and supports disabling picking", () => {
    const cloud = new GaussianCloud({} as GaussianCloudOwner, 0, 0);
    cloud.setRaycastIndex(new GaussianRaycastIndex(snapshot(2)));
    cloud.scale.set(2, 1, 3);
    cloud.position.z = -4;
    cloud.updateMatrixWorld(true);
    const caster = new Raycaster(new Vector3(-4, 0, 10), new Vector3(0, 0, -1));
    const hits: ReturnType<Raycaster["intersectObject"]> = [];
    cloud.raycast(caster, hits);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.distance).toBeCloseTo(14 - 3 * Math.exp(-1), 2);
    cloud.raycastable = false;
    expect(caster.intersectObject(cloud)).toHaveLength(0);
    cloud.raycastable = true;
    cloud.setRaycastIndex(null);
    expect(caster.intersectObject(cloud)).toHaveLength(0);
  });
  it("rejects cyclic snapshots", () => {
    const tree = snapshot(2);
    const children = new Uint32Array(tree.nodeChildren);
    children[0] = 0;
    children[1] = 1;
    expect(() => new GaussianRaycastIndex(tree)).toThrow(/cycle/);
  });
});
