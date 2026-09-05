/** Conservative minimum of the positive-definite conic over each 4x4 block.
 * The rectangle includes the full pixel cells, not only their centers.
 * Fail open for poorly conditioned conics; inflate the threshold for rounding.
 */
export declare function rasterBlockMaskWGSL(tileSize: 8 | 16): string;
