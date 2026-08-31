import { describe, expect, it, vi } from "vitest";
import { KernelTimingInspector } from "../sandbox/src/KernelTimingInspector";

describe("KernelTimingInspector", () => {
  it("records timestamp queries only on sampled frames", () => {
    const inspector = new KernelTimingInspector();
    const backend = {
      trackTimestamp: true,
      timestampQueryPool: {},
    };
    inspector.setRenderer({
      backend,
      _nodes: { nodeFrame: { frameId: 1 } },
    } as never);
    let time = 1_000;
    const now = vi.spyOn(performance, "now").mockImplementation(() => time);

    inspector.begin();
    expect(backend.trackTimestamp).toBe(true);
    inspector.beginCompute("sample:f1", { name: "sample" } as never);
    expect(
      (inspector as unknown as { currentFrame: { computes: unknown[] } })
        .currentFrame.computes,
    ).toHaveLength(1);

    time = 1_100;
    inspector.begin();
    expect(backend.trackTimestamp).toBe(false);
    inspector.beginCompute("skipped:f2", { name: "skipped" } as never);
    expect(
      (inspector as unknown as { currentFrame: { computes: unknown[] } })
        .currentFrame.computes,
    ).toHaveLength(1);

    time = 1_200;
    inspector.begin();
    expect(backend.trackTimestamp).toBe(true);
    now.mockRestore();
  });

  it("aggregates repeated kernels and preserves batched group names", () => {
    const inspector = new KernelTimingInspector();
    const computeTimestamps = new Map<string, number>();
    const renderTimestamps = new Map<string, number>();
    inspector.setRenderer({
      backend: {
        timestampQueryPool: {
          compute: { timestamps: computeTimestamps },
          render: { timestamps: renderTimestamps },
        },
      },
    } as never);
    const projection = { name: "3DGS projection WGSL" };
    const scanBlocks = { name: "3DGS radix scan block histograms WGSL" };
    const scanDigits = { name: "3DGS radix scan digit totals WGSL" };
    const computeUids = [
      "projection:f17",
      "scan-1:f17",
      "scan-2:f17",
      "batch:f17",
      "other:f17",
    ] as const;
    for (const uid of computeUids) computeTimestamps.set(uid, 1);
    renderTimestamps.set("render:f17", 1);
    computeTimestamps.set("future:f18", 1);
    renderTimestamps.set("future-render:f18", 1);

    inspector.resolveFrame({
      frameId: 17,
      computes: [
        {
          uid: computeUids[0],
          computeNode: projection,
          cpu: 0.1,
          gpu: 1.25,
        },
        {
          uid: computeUids[1],
          computeNode: scanBlocks,
          cpu: 0.02,
          gpu: 0.2,
        },
        {
          uid: computeUids[2],
          computeNode: scanBlocks,
          cpu: 0.03,
          gpu: 0.3,
        },
        {
          uid: computeUids[3],
          computeNode: [scanBlocks, scanDigits],
          cpu: 0.04,
          gpu: 0.4,
        },
        {
          uid: computeUids[4],
          computeNode: { name: "unrelated compute" },
          cpu: 1,
          gpu: 10,
        },
      ],
      renders: [{ uid: "render:f17", gpu: 0.75 }],
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
    expect([...computeTimestamps.keys()]).toEqual(["future:f18"]);
    expect([...renderTimestamps.keys()]).toEqual(["future-render:f18"]);
  });
});
