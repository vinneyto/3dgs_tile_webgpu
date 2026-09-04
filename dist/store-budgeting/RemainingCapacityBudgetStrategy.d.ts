import type { GaussianStoreBudgetContext, GaussianStoreBudgetStrategy } from "./GaussianStoreBudgetStrategy";
/** Gives the current entry all capacity left by higher-priority entries. */
export declare class RemainingCapacityBudgetStrategy implements GaussianStoreBudgetStrategy {
    allocate({ remainingGaussians }: GaussianStoreBudgetContext): number;
}
