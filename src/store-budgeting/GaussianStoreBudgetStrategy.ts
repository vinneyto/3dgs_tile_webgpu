import type { GaussianCloud } from "../GaussianCloud";

export interface GaussianStoreBudgetEntry {
  readonly cloud: GaussianCloud;
  readonly priority: number;
  readonly insertionIndex: number;
  readonly sourceGaussianCount: number;
}

export interface GaussianStoreBudgetContext {
  readonly capacity: number;
  readonly allocatedGaussians: number;
  readonly remainingGaussians: number;
  readonly entry: GaussianStoreBudgetEntry;
}

/** Assigns a packing budget to one entry during a priority-ordered Store repack. */
export interface GaussianStoreBudgetStrategy {
  allocate(context: GaussianStoreBudgetContext): number;
}
