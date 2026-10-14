/** Node assignment versions the owning logical pass, without rebuilding other passes. */
export declare class GaussianPassNodes<T extends object> {
    readonly nodes: T;
    private readonly listeners;
    constructor(defaults: T);
    invalidate(): void;
    subscribe(listener: () => void): () => void;
}
