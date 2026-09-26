import { GaussianData } from "./GaussianData";
export declare class CanonicalGaussianPlyLoader {
    load(url: string): Promise<GaussianData>;
    parse(buffer: ArrayBuffer): GaussianData;
}
