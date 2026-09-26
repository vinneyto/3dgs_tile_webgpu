/** Run the same builder either synchronously or in cancellable worker slices. */
export declare function buildSync<T>(steps: Generator<void, T>): T;
export declare function buildAsync<T>(steps: Generator<void, T>, signal: AbortSignal): Promise<T>;
