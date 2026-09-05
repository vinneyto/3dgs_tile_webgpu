import type {
  GaussianPassOptions,
  GaussianStoreDefaultLodOptions,
  RadixBackend,
} from "../../src/index";

export interface SandboxOptions {
  readonly debugEnabled: boolean;
  readonly profileEnabled: boolean;
  readonly statsEnabled: boolean;
  readonly pixelRatio: number;
  readonly pass: GaussianPassOptions;
  readonly streamingLod: GaussianStoreDefaultLodOptions;
}

export function readSandboxOptions(
  parameters = new URLSearchParams(location.search),
): SandboxOptions {
  const profileEnabled = parameters.get("profile") === "kernels";
  return {
    debugEnabled: parameters.get("debug") !== "0",
    profileEnabled,
    statsEnabled: profileEnabled || parameters.get("stats") !== "0",
    pixelRatio: readRenderPixelRatio(parameters),
    pass: {
      depthSortMode:
        parameters.get("sort") === "packed16" ? "packed16" : "float32",
      antialiasMode:
        parameters.get("aa") === "classic" ? "classic" : "compensated",
      background: [0.018, 0.022, 0.032, 1],
      profileKernels: profileEnabled,
      rasterTransmittanceThreshold: readRasterThreshold(parameters),
      maxRasterizedSplatsPerTile: readOptionalLimit(parameters, "tileCap"),
      rasterChunkSize: readOptionalLimit(parameters, "rasterChunk"),
      subpixelSampleCulling: parameters.get("subpixelCull") !== "0",
      radixBackend: readRadixBackend(parameters),
    },
    streamingLod: {
      maxUploadBytesPerPack:
        readPositiveQuery(parameters, "lodUploadKiB", 1024) * 1024,
      maxChangedCellsPerPack: readPositiveIntegerQuery(
        parameters,
        "lodCells",
        16,
      ),
    },
  };
}

function readRasterThreshold(parameters: URLSearchParams): number {
  const value = Number(parameters.get("rasterT") ?? "0.001");
  return Number.isFinite(value) && value > 0 && value < 1 ? value : 0.001;
}

function readRenderPixelRatio(parameters: URLSearchParams): number {
  const requested = Number(parameters.get("dpr") ?? "1");
  if (!Number.isFinite(requested)) return 1;
  return Math.min(2, Math.max(0.25, requested));
}

function readRadixBackend(parameters: URLSearchParams): RadixBackend {
  const requested = parameters.get("radix");
  return requested === "subgroup" || requested === "workgroup"
    ? requested
    : "auto";
}

function readOptionalLimit(
  parameters: URLSearchParams,
  name: string,
): number | null | undefined {
  const raw = parameters.get(name);
  if (raw === null) return undefined;
  if (raw === "0") return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer or 0`);
  }
  return value;
}

function readPositiveQuery(
  parameters: URLSearchParams,
  name: string,
  fallback: number,
): number {
  const raw = parameters.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite and positive`);
  }
  return value;
}

function readPositiveIntegerQuery(
  parameters: URLSearchParams,
  name: string,
  fallback: number,
): number {
  const value = readPositiveQuery(parameters, name, fallback);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be a positive integer`);
  }
  return value;
}
