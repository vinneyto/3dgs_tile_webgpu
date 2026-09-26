import { GaussianStorePackedAttribute, type GaussianStorePackedAttributeFormat } from "./GaussianStorePackedAttribute";
/** @internal Store-only registration entry point; intentionally not re-exported. */
export declare const enableGaussianStoreAttribute: unique symbol;
export declare const disposeGaussianStoreAttributes: unique symbol;
/** Public registry of optional attributes sharing GaussianStore packed slots. */
export declare class GaussianStoreAttributes implements Iterable<GaussianStorePackedAttribute> {
    private readonly attributes;
    get size(): number;
    get(name: string): GaussianStorePackedAttribute | undefined;
    has(name: string): boolean;
    values(): IterableIterator<GaussianStorePackedAttribute>;
    [Symbol.iterator](): IterableIterator<GaussianStorePackedAttribute>;
    [enableGaussianStoreAttribute](name: string, format: GaussianStorePackedAttributeFormat): GaussianStorePackedAttribute;
    [disposeGaussianStoreAttributes](): void;
}
