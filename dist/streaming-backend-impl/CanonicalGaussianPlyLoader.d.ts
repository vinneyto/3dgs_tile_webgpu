import { CpuGaussianSource } from "./GaussianSource";
export declare class CanonicalGaussianPlyLoader {
    load(url: string): Promise<CpuGaussianSource>;
    parse(buffer: ArrayBuffer): CpuGaussianSource;
}
