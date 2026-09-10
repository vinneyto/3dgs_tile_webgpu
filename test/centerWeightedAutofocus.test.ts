import { describe, expect, it } from "vitest";
import { weightedMedianFocusDistance } from "../sandbox/src/centerWeightedAutofocus";

describe("center-weighted autofocus", () => {
  it("returns null without ray hits", () => {
    expect(weightedMedianFocusDistance([])).toBeNull();
  });

  it("rejects isolated near and far outliers", () => {
    expect(
      weightedMedianFocusDistance([
        { distance: 1, weight: 1 },
        { distance: 9.8, weight: 2 },
        { distance: 10, weight: 6 },
        { distance: 10.2, weight: 2 },
        { distance: 100, weight: 1 },
      ]),
    ).toBe(10);
  });

  it("lets a supported central surface win", () => {
    expect(
      weightedMedianFocusDistance([
        { distance: 4, weight: 6 },
        { distance: 4.1, weight: 2 },
        { distance: 12, weight: 2 },
        { distance: 12.2, weight: 2 },
      ]),
    ).toBe(4);
  });
});
