export interface AutofocusRaySample {
  readonly x: number;
  readonly y: number;
  readonly weight: number;
}

export interface AutofocusDistanceSample {
  readonly distance: number;
  readonly weight: number;
}

const RADIUS = 0.04;

/** Nine center-weighted samples in normalized device coordinates. */
export const CENTER_WEIGHTED_AUTOFOCUS_PATTERN: readonly AutofocusRaySample[] =
  [
    { x: 0, y: 0, weight: 6 },
    { x: -RADIUS, y: 0, weight: 2 },
    { x: RADIUS, y: 0, weight: 2 },
    { x: 0, y: -RADIUS, weight: 2 },
    { x: 0, y: RADIUS, weight: 2 },
    { x: -RADIUS, y: -RADIUS, weight: 1 },
    { x: RADIUS, y: -RADIUS, weight: 1 },
    { x: -RADIUS, y: RADIUS, weight: 1 },
    { x: RADIUS, y: RADIUS, weight: 1 },
  ];

/** Robust focus estimate that favors the center without trusting one ray. */
export function weightedMedianFocusDistance(
  samples: readonly AutofocusDistanceSample[],
): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a.distance - b.distance);
  const middleWeight =
    sorted.reduce((total, sample) => total + sample.weight, 0) / 2;
  let accumulatedWeight = 0;
  for (const sample of sorted) {
    accumulatedWeight += sample.weight;
    if (accumulatedWeight >= middleWeight) return sample.distance;
  }
  return sorted.at(-1)!.distance;
}
