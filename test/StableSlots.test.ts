import { beforeAll, describe, expect, it, vi } from "vitest";
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
  it("keeps inactive details resident and revisits cached cuts with index deltas only", async () => {
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
      await vi.waitFor(() =>
        expect(
          responses.some(
            (r) =>
              r.command.type === "prefetch-cache" &&
              r.isFinal &&
              r.metrics?.prefetchPending === false,
          ),
        ).toBe(true),
      );
      const data = store.getPackedData();
      const capacity = store.maxGaussians;
      const slotOf = (x: number) => {
        for (let slot = 0; slot < capacity; slot++)
          if (
            data.means.array[slot * 4 + 3]! >= 0 &&
            data.means.array[slot * 4] === x
          )
            return slot;
        throw new Error(`Missing resident Gaussian at x=${x}`);
      };
      const sharedSlot = slotOf(1);
      const initialSlots = Array.from(
        data.activeSlots!.subarray(0, data.activeCount),
      ).sort();
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
      await move("slide", 2, 1.05);
      expect(store.getPackedData()).toBe(data);
      expect(slotOf(1)).toBe(sharedSlot);
      data.means.clearUpdateRanges();
      await move("offscreen", 20, 0.1);
      // The default downgrade grace completes without another camera command.
      await vi.waitFor(
        () => expect(data.activeCount).toBeLessThan(initialSlots.length),
        { interval: 10 },
      );
      expect(store.count).toBeGreaterThan(0);
      expect(data.activeCount).toBe(store.count);
      expect(data.means.updateRanges).toEqual([]);
      const resident = Array.from(
        { length: capacity },
        (_, slot) => data.means.array[slot * 4 + 3]!,
      ).filter((object) => object >= 0).length;
      expect(resident).toBeGreaterThan(data.activeCount);
      expect(slotOf(1)).toBe(sharedSlot);
      await move("return", 1, 1.05);
      expect(store.maxGaussians).toBe(capacity);
      expect(store.getPackedData()).toBe(data);
      expect(data.means.updateRanges).toEqual([]);
      expect(
        Array.from(data.activeSlots!.subarray(0, data.activeCount)).sort(),
      ).toEqual(initialSlots);
      const returned = responses.filter(
        ({ command }) => command.id === "return",
      );
      expect(
        returned.some(({ payload }) => payload?.type === "buffers-activated"),
      ).toBe(true);
      expect(
        returned.some(({ payload }) => payload?.type === "buffers-patched"),
      ).toBe(false);
      expect(returned.at(-1)?.metrics).toMatchObject({
        cacheMisses: 0,
        evictedGaussians: 0,
      });
      await move("unchanged", 1.01, 1.05);
      expect(
        responses.filter(
          ({ command, payload }) => command.id === "unchanged" && payload,
        ),
      ).toHaveLength(0);
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
