import type { Command } from "./Command";
/** Fill one bounded batch of unused GPU slots without changing the draw cut. */
export interface PrefetchCacheCommand extends Command<"prefetch-cache"> {}
