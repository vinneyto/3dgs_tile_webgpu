/** A typed connection to a producer. Read again after growth/layout changes. */
export declare class GaussianPassOutput<T> {
    readonly producer: object;
    readonly name: string;
    private readValue;
    constructor(producer: object, name: string);
    get available(): boolean;
    read(): T;
    /** @internal Bound by the producer runtime, never by a consumer. */
    bind(read: (() => T) | null): void;
}
