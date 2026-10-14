/** A typed connection to a producer. Read again after growth/layout changes. */
export class GaussianPassOutput<T> {
  private readValue: (() => T) | null = null;
  constructor(
    readonly producer: object,
    readonly name: string,
  ) {}
  get available(): boolean {
    return this.readValue !== null;
  }
  read(): T {
    if (!this.readValue)
      throw new Error(`${this.name} is not prepared or has been disposed`);
    return this.readValue();
  }
  /** @internal Bound by the producer runtime, never by a consumer. */
  bind(read: (() => T) | null): void {
    this.readValue = read;
  }
}
