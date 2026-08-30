import type {
  GaussianStoreBudgetContext,
  GaussianStoreBudgetStrategy,
} from "./GaussianStoreBudgetStrategy";

/** Caps each cloud allocation to a fraction of its full source count. */
export class SourceFractionBudgetStrategy implements GaussianStoreBudgetStrategy {
  readonly fraction: number;

  constructor(fraction: number) {
    if (!(fraction > 0 && fraction <= 1)) {
      throw new RangeError("Gaussian source budget fraction must be in (0, 1]");
    }
    this.fraction = fraction;
  }

  allocate({ remainingGaussians, entry }: GaussianStoreBudgetContext): number {
    return Math.min(
      remainingGaussians,
      Math.floor(entry.sourceGaussianCount * this.fraction),
    );
  }
}
