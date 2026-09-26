import type { RadixBackend, ResolvedRadixBackend } from "./types";

export function resolveRadixBackend(
  requested: RadixBackend,
  hasSubgroups: boolean,
): ResolvedRadixBackend {
  if (
    requested !== "auto" &&
    requested !== "subgroup" &&
    requested !== "workgroup"
  ) {
    throw new RangeError(
      'radixBackend must be "auto", "subgroup", or "workgroup"',
    );
  }
  if (requested === "subgroup" && !hasSubgroups) {
    throw new Error(
      'radixBackend "subgroup" requires the WebGPU "subgroups" feature',
    );
  }
  if (requested === "auto") {
    return hasSubgroups ? "subgroup" : "workgroup";
  }
  return requested;
}
