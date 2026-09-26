export interface CloudBounds {
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly radius: number;
}

export const SANDBOX_LOD_LEVELS = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 },
] as const;
