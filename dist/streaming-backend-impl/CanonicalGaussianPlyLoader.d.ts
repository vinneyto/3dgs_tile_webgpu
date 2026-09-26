import { CpuGaussianSource } from "./GaussianSource";
export declare class CanonicalGaussianPlyLoader {
    load(url: string): Promise<CpuGaussianSource>;
    parse(buffer: ArrayBuffer): CpuGaussianSource;
    parseAsync(buffer: ArrayBuffer, signal: AbortSignal): Promise<CpuGaussianSource>;
    private parseChunks;
}
