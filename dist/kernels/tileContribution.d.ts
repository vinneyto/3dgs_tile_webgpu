interface TileContributionNames {
    center: string;
    conic: string;
    powerThreshold: string;
    tileX: string;
    tileY: string;
    onHit: string;
}
/**
 * Conservative StopThePop tile/ellipse test shared verbatim by projection
 * and emission. Keeping the two loops identical prevents count/emission drift.
 */
export declare function tileContributionWGSL(names: TileContributionNames): string;
export {};
