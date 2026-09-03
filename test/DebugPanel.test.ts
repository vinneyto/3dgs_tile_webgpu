import { describe, expect, it, vi } from "vitest";

import type {
  GaussianPassDebugListener,
  GaussianStorePackStats,
} from "../src/index";
import { DebugPanel } from "../sandbox/src/DebugPanel";

describe("DebugPanel", () => {
  it("owns pass debug subscription, filtering and cleanup", () => {
    let listener: GaussianPassDebugListener | null = null;
    const unsubscribe = vi.fn();
    const pass = {
      subscribeDebug: vi.fn((next: GaussianPassDebugListener) => {
        listener = next;
        return unsubscribe;
      }),
    };
    const element = fakeElement();
    const panel = new DebugPanel(
      {} as never,
      element,
      fakeElement(),
      null,
      false,
      false,
    );
    const cloud = {};
    const onPack = vi.fn();
    const storePack = {
      planningMs: 1.5,
      slotUpdateMs: 0.5,
    } as GaussianStorePackStats;

    panel.setPass(pass as never, { cloud: cloud as never, onPack });
    expect(listener).not.toBeNull();
    const publish = listener as unknown as GaussianPassDebugListener;
    publish({
      pass: {} as never,
      storePack,
      lod: {
        appliedBatches: 1,
        pending: true,
        clouds: [
          {
            cloud: cloud as never,
            focusDistance: 4,
            applied: true,
            pending: true,
            targetStats: {
              planningMs: 2,
              roundTripMs: 3,
              discardedResults: 1,
              pending: true,
            },
          },
        ],
      },
    });
    publish({
      pass: {} as never,
      storePack,
      lod: { appliedBatches: 0, pending: false, clouds: [] },
    });

    expect(onPack).toHaveBeenCalledOnce();
    expect(onPack).toHaveBeenCalledWith(storePack);
    expect(
      panel as unknown as {
        packCount: number;
        packDurationMs: number;
        packingFocusDistance: number;
      },
    ).toMatchObject({
      packCount: 1,
      packDurationMs: 2,
      packingFocusDistance: 4,
    });

    panel.setPass(null);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

function fakeElement(): HTMLElement {
  return {
    hidden: false,
    addEventListener: vi.fn(),
  } as unknown as HTMLElement;
}
