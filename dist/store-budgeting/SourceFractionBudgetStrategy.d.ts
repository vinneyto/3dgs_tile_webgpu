import type { GaussianStoreBudgetContext, GaussianStoreBudgetStrategy } from "./GaussianStoreBudgetStrategy";
/** Caps each cloud allocation to a fraction of its full source count. */
export declare class SourceFractionBudgetStrategy implements GaussianStoreBudgetStrategy {
    readonly fraction: number;
    constructor(fraction: number);
    allocate({ remainingGaussians, entry }: GaussianStoreBudgetContext): number;
}
