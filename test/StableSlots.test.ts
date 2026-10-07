import { beforeAll, describe, expect, it } from "vitest";
import { GaussianStore } from "../src/renderer/GaussianStore";
import { WasmGaussianBackend } from "../src/wasm-backend/WasmGaussianBackend";
import type { BackendResponse } from "../src/streaming-backend/BackendResponse";
import {
  createSetCameraCommand,
  createSetFrontendCapabilitiesCommand,
} from "../src/streaming-backend/commands/createCommands";
import { initializeTestWasm } from "./helpers/wasm";

beforeAll(initializeTestWasm);

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const capabilities = {
  maxStorageBufferBindingSize: 128 * 1024 * 1024,
  maxBufferSize: 256 * 1024 * 1024,
  maxStorageBuffersPerShaderStage: 8,
  supportsPartialBufferUpdates: true,
};

describe("stable WASM GPU slots", () => {
  it("applies camera deltas without moving retained records or losing high occupied slots", async () => {
    const store = new GaussianStore(new WasmGaussianBackend());
    const responses: BackendResponse[] = [];
    store.scheduler.onResponse((response) => responses.push(response));
    try {
      await store.loadBuffer(rowCloud(), { format: "splat" });
      const camera = (x: number, halfWidth: number) => {
        const world = [...identity];
        world[12] = x;
        const projection = [...identity];
        projection[0] = 1 / halfWidth;
        return { world, projection };
      };
      const initial = camera(1, 1.05);
      await store.scheduler.schedule(
        createSetFrontendCapabilitiesCommand(
          "caps",
          capabilities,
          1,
          initial.world,
          initial.projection,
          [],
          1024,
          1024,
        ),
      );
      const slotOf = (x: number) => {
        const means = store.getPackedData().means.array;
        for (let slot = 0; slot < store.maxGaussians; slot++)
          if (means[slot * 4 + 3]! >= 0 && means[slot * 4] === x) return slot;
        throw new Error(`Missing occupied Gaussian at x=${x}`);
      };
      const slots = [0, 1, 2].map(slotOf);
      expect(store.count).toBe(3);
      expect(store.maxGaussians).toBe(4);
      const move = async (id: string, x: number, halfWidth: number) => {
        const next = camera(x, halfWidth);
        await store.scheduler.schedule(
          createSetCameraCommand(
            id,
            2,
            next.world,
            next.projection,
            1024,
            1024,
          ),
        );
      };
      let data = store.getPackedData();
      data.means.clearUpdateRanges();
      await move("slide", 2, 1.05);
      expect(store.getPackedData()).toBe(data);
      expect(slotOf(1)).toBe(slots[1]);
      expect(slotOf(2)).toBe(slots[2]);
      expect(slotOf(3)).toBe(slots[0]);
      expect(data.means.updateRanges).toEqual([
        { start: slots[0]! * 4, count: 4 },
      ]);
      expect(store.lastPackStats).toMatchObject({
        reusedSlots: 2,
        writtenSlots: 1,
        clearedSlots: 0,
      });
      await move("unchanged", 2.01, 1.05);
      expect(
        responses.filter(
          ({ command, payload }) => command.id === "unchanged" && payload,
        ),
      ).toHaveLength(0);

      // Keep the highest slot occupied while lowering the active count to one.
      const highX = slots[1]! > slots[2]! ? 1 : 2;
      const highSlot = slotOf(highX);
      expect(highSlot).toBeGreaterThan(0);
      await move("narrow", highX, 0.1);
      expect(store.count).toBe(1);
      expect(data.count).toBe(4);
      expect(slotOf(highX)).toBe(highSlot);
      for (let slot = 0; slot < data.count; slot++)
        if (slot !== highSlot) {
          expect(data.means.array[slot * 4 + 3]).toBe(-1);
          expect(data.scalesOpacity.array[slot * 4 + 3]).toBe(0);
        }
      expect(store.lastPackStats).toMatchObject({
        reusedSlots: 1,
        writtenSlots: 0,
        clearedSlots: 2,
      });
      // Growing the object layout preserves the occupied high slot and holes.
      await store.loadBuffer(rowCloud(100), { format: "splat" });
      await move("settle-layout", highX, 0.1);
      expect(store.getPackedData()).not.toBe(data);
      data = store.getPackedData();
      expect(store.count).toBe(1);
      expect(slotOf(highX)).toBe(highSlot);
      expect(store.lastPackStats).toMatchObject({
        fullRebuild: false,
        writtenSlotRanges: [{ start: highSlot, count: 1 }],
      });
      await move("empty", 20, 0.1);
      expect(store.count).toBe(0);
      expect(store.maxGaussians).toBe(4);
      await move("refill", 1, 1.05);
      expect(store.count).toBe(3);
      expect([0, 1, 2].map(slotOf).sort()).toEqual([0, 1, 2]);

      // A priority change with the same records updates metadata without uploads.
      const metadataData = store.getPackedData();
      const version = store.contentVersion;
      metadataData.means.clearUpdateRanges();
      await store.setPackingPriority(store.clouds[0]!, 10);
      expect(store.contentVersion).toBeGreaterThan(version);
      expect(metadataData.means.updateRanges).toEqual([]);
      expect(store.lastPackStats).toMatchObject({
        reusedSlots: 3,
        writtenSlots: 0,
        clearedSlots: 0,
        estimatedUploadBytes: 0,
      });
    } finally {
      store.dispose();
    }
  });
});

function rowCloud(offset = 0): ArrayBuffer {
  const buffer = new ArrayBuffer(5 * 32);
  const view = new DataView(buffer);
  for (let i = 0; i < 5; i++) {
    const at = i * 32;
    view.setFloat32(at, i + offset, true);
    view.setFloat32(at + 8, 0.5, true);
    for (let axis = 0; axis < 3; axis++)
      view.setFloat32(at + 12 + axis * 4, 0.02, true);
    new Uint8Array(buffer, at + 24, 8).set([
      128, 128, 128, 255, 255, 128, 128, 128,
    ]);
  }
  return buffer;
}
