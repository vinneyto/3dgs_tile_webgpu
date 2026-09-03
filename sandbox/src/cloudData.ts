import type {
  GaussianCloud,
  GaussianData,
  GaussianStore,
} from "../../src/index";
import { GaussianLod, GaussianOctree } from "../../src/index";

export const SANDBOX_LOD_LEVELS = [
  { retention: 0.2 },
  { retention: 0.5 },
  { retention: 1 },
] as const;

export interface CloudBounds {
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly radius: number;
}

export function addDataWithSandboxLod(
  store: GaussianStore,
  data: GaussianData,
  name: string,
): GaussianCloud {
  const octree = GaussianOctree.build(data, { ownsData: true });
  let lod: GaussianLod | null = null;
  try {
    lod = GaussianLod.build(octree, {
      levels: SANDBOX_LOD_LEVELS,
      ownsOctree: true,
    });
    return store.addLod(lod, { name, ownsLod: true });
  } catch (error) {
    if (lod !== null) lod.dispose();
    else octree.dispose();
    throw error;
  }
}

export function measureCloud(data: GaussianData): CloudBounds {
  const means = data.means.array as Float32Array;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let gaussian = 0; gaussian < data.count; gaussian++) {
    const offset = gaussian * 4;
    const x = means[offset]!;
    const y = means[offset + 1]!;
    const z = means[offset + 2]!;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  return {
    centerX: (minX + maxX) * 0.5,
    centerY: (minY + maxY) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
    radius: Math.max(
      Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) * 0.5,
      0.1,
    ),
  };
}
