/** Run the same builder either synchronously or in cancellable worker slices. */
export function buildSync<T>(steps: Generator<void, T>): T {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

export async function buildAsync<T>(steps: Generator<void, T>, signal: AbortSignal): Promise<T> {
  let step = steps.next();
  while (!step.done) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (signal.aborted) throw new DOMException("Load cancelled", "AbortError");
    step = steps.next();
  }
  if (signal.aborted) throw new DOMException("Load cancelled", "AbortError");
  return step.value;
}
