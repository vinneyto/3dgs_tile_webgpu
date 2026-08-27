import { describe, expect, it } from "vitest";
import { KernelTimingInspector } from "../sandbox/src/KernelTimingInspector";

describe("KernelTimingInspector", () => {
  it("aggregates repeated kernels and preserves batched group names", () => {
    const inspector = new KernelTimingInspector();
    const projection = { name: "3DGS projection WGSL" };
    const scanBlocks = { name: "3DGS radix scan block histograms WGSL" };
    const scanDigits = { name: "3DGS radix scan digit totals WGSL" };

    inspector.resolveFrame({
      frameId: 17,
      computes: [
        { computeNode: projection, cpu: 0.1, gpu: 1.25 },
        { computeNode: scanBlocks, cpu: 0.02, gpu: 0.2 },
        { computeNode: scanBlocks, cpu: 0.03, gpu: 0.3 },
        {
          computeNode: [scanBlocks, scanDigits],
          cpu: 0.04,
          gpu: 0.4,
        },
        { computeNode: { name: "unrelated compute" }, cpu: 1, gpu: 10 },
      ],
      renders: [{ gpu: 0.75 }],
    });

    expect(inspector.latest).toMatchObject({
      frameId: 17,
      computeMs: 2.15,
      renderMs: 0.75,
      kernels: [
        { name: "projection", calls: 1, gpuMs: 1.25, cpuMs: 0.1 },
        {
          name: "radix/scan block histograms",
          calls: 2,
          gpuMs: 0.5,
          cpuMs: 0.05,
        },
        {
          name: "radix/scan block histograms + radix/scan digit totals",
          calls: 1,
          gpuMs: 0.4,
          cpuMs: 0.04,
        },
      ],
    });
  });
});
