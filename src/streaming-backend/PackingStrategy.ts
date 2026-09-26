export interface MaximumPackingStrategy {
  type: "maximum";
}

export interface RadialPackingStrategy {
  type: "radial";
  lodLevel?: number | "finest";
}

export interface TieredRadialPackingStrategy {
  type: "tiered-radial";
  budgetShares?: readonly [number, number, number];
}

export interface DistanceAwareRadialPackingStrategy {
  type: "distance-aware-radial";
  levelDistance?: number;
}

export type PackingStrategy =
  | MaximumPackingStrategy
  | RadialPackingStrategy
  | TieredRadialPackingStrategy
  | DistanceAwareRadialPackingStrategy;
