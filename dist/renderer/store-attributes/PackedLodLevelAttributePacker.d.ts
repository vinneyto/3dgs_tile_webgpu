import { type GaussianStoreAttributePacker, type GaussianStoreAttributeUploadStats, type PackedCellUpdateContext, type PackedLayoutContext } from "./GaussianStoreAttributePacker";
import { type GaussianStorePackedAttribute } from "./GaussianStorePackedAttribute";
/** Fills the built-in current-cell LOD value for every active packed slot. */
export declare class PackedLodLevelAttributePacker implements GaussianStoreAttributePacker {
    readonly attribute: GaussianStorePackedAttribute;
    private readonly writtenSlots;
    private freshBuffer;
    constructor(attribute: GaussianStorePackedAttribute);
    allocate(capacity: number): void;
    backfill(context: PackedLayoutContext): void;
    updateCell(context: PackedCellUpdateContext): void;
    commit(): GaussianStoreAttributeUploadStats;
}
