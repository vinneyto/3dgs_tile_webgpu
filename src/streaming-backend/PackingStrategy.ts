export type PackingStrategy =
  | { type: "maximum" }
  | { type: "radial"; lodLevel?: number | "finest" }
  | { type: "tiered-radial"; budgetShares?: readonly [number, number, number] }
  | { type: "distance-aware-radial"; levelDistance?: number };
