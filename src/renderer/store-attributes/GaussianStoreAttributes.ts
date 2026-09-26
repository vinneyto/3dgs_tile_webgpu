import {
  disposeGaussianStoreAttribute,
  GaussianStorePackedAttribute,
  type GaussianStorePackedAttributeFormat,
} from "./GaussianStorePackedAttribute";

/** @internal Store-only registration entry point; intentionally not re-exported. */
export const enableGaussianStoreAttribute = Symbol(
  "enableGaussianStoreAttribute",
);
export const disposeGaussianStoreAttributes = Symbol(
  "disposeGaussianStoreAttributes",
);

/** Public registry of optional attributes sharing GaussianStore packed slots. */
export class GaussianStoreAttributes implements Iterable<GaussianStorePackedAttribute> {
  private readonly attributes = new Map<string, GaussianStorePackedAttribute>();

  get size(): number {
    return this.attributes.size;
  }

  get(name: string): GaussianStorePackedAttribute | undefined {
    return this.attributes.get(name);
  }

  has(name: string): boolean {
    return this.attributes.has(name);
  }

  values(): IterableIterator<GaussianStorePackedAttribute> {
    return this.attributes.values();
  }

  [Symbol.iterator](): IterableIterator<GaussianStorePackedAttribute> {
    return this.values();
  }

  [enableGaussianStoreAttribute](
    name: string,
    format: GaussianStorePackedAttributeFormat,
  ): GaussianStorePackedAttribute {
    const existing = this.attributes.get(name);
    if (existing !== undefined) {
      if (existing.format !== format) {
        throw new Error(
          `GaussianStore attribute ${name} already uses format ${existing.format}`,
        );
      }
      return existing;
    }
    const attribute = new GaussianStorePackedAttribute(name, format);
    this.attributes.set(name, attribute);
    return attribute;
  }

  [disposeGaussianStoreAttributes](): void {
    for (const attribute of this.attributes.values()) {
      attribute[disposeGaussianStoreAttribute]();
    }
    this.attributes.clear();
  }
}
