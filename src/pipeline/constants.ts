export const TILE_SIZE = 16;
export const WORKGROUP_SIZE = 256;
export const SCAN_BLOCK_ITEMS = 512;
export const RADIX_BITS = 4;
export const RADIX_SIZE = 1 << RADIX_BITS;
export const RADIX_BLOCK_ITEMS = 256;

export const FRAME_UNIFORM_BYTES = 256;
export const DISPATCH_STATE_BYTES = 16;
export const RADIX_DISPATCH_OFFSET = 256;
export const LINEAR_DISPATCH_OFFSET = 272;
export const DISPATCH_BYTES = 288;
export const PROJECTED_COMPONENT_BYTES = 16;
export const UINT_BYTES = 4;
