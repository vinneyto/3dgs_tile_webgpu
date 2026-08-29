import {
  BoxGeometry,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  Vector3,
  type ColorRepresentation,
} from "three/webgpu";

import type { GaussianLod, GaussianLodPacking } from "./GaussianLod";

export interface LodHelperOptions {
  /** Initially visible LOD levels. Defaults to every level. */
  levels?: readonly number[];
  /** Color by LOD level. Missing colors cycle through the default palette. */
  colors?: readonly ColorRepresentation[];
  opacity?: number;
  wireframe?: boolean;
  /** Defaults to false so volumes remain visible through the cloud. */
  depthTest?: boolean;
}

const DEFAULT_COLORS: readonly ColorRepresentation[] = [
  0xff4d6d, 0xffb703, 0x38d996, 0x4cc9f0, 0x9b5de5,
];

/** Color-coded local-space volumes for the active cells in a LOD packing. */
export class LodHelper extends Object3D {
  readonly isLodHelper = true;

  private readonly colors: readonly ColorRepresentation[];
  private readonly opacity: number;
  private readonly wireframe: boolean;
  private readonly depthTest: boolean;
  private readonly levelMeshes = new Map<
    number,
    InstancedMesh<BoxGeometry, MeshBasicMaterial>
  >();
  private visibleLevelSet = new Set<number>();
  private packing: GaussianLodPacking;

  constructor(
    readonly lod: GaussianLod,
    packing: GaussianLodPacking,
    options: LodHelperOptions = {},
  ) {
    super();
    this.packing = packing;
    this.colors =
      options.colors !== undefined && options.colors.length > 0
        ? [...options.colors]
        : DEFAULT_COLORS;
    this.opacity = options.opacity ?? 0.14;
    this.wireframe = options.wireframe ?? false;
    this.depthTest = options.depthTest ?? false;
    this.name = "Gaussian LOD helper";
    lod.indicesForPacking(packing);
    this.rebuildMeshes();
    this.setLevels(
      options.levels ??
        Array.from({ length: lod.levelCount }, (_, level) => level),
    );
  }

  get lodPacking(): GaussianLodPacking {
    return this.packing;
  }

  get visibleLevels(): readonly number[] {
    return [...this.visibleLevelSet].sort((left, right) => left - right);
  }

  get instanceCounts(): readonly number[] {
    return Array.from(
      { length: this.lod.levelCount },
      (_, level) => this.levelMeshes.get(level)?.count ?? 0,
    );
  }

  setLevels(levels: readonly number[]): this {
    const next = new Set<number>();
    for (const level of levels) {
      if (
        !Number.isInteger(level) ||
        level < 0 ||
        level >= this.lod.levelCount
      ) {
        throw new RangeError(`Gaussian LOD level ${level} does not exist`);
      }
      next.add(level);
    }
    this.visibleLevelSet = next;
    for (const [level, mesh] of this.levelMeshes) {
      mesh.visible = next.has(level);
    }
    return this;
  }

  /** Replace the active cell/level cut, for example after a future dynamic repack. */
  setPacking(packing: GaussianLodPacking): this {
    this.lod.indicesForPacking(packing);
    this.packing = packing;
    this.rebuildMeshes();
    this.setLevels(this.visibleLevels);
    return this;
  }

  dispose(): void {
    this.removeFromParent();
    this.disposeMeshes();
  }

  private rebuildMeshes(): void {
    this.disposeMeshes();
    const nodeIdsByLevel = Array.from(
      { length: this.lod.levelCount },
      () => [] as number[],
    );
    for (let entry = 0; entry < this.packing.nodeIds.length; entry++) {
      const level = this.packing.lodLevels[entry]!;
      const destination = nodeIdsByLevel[level];
      if (destination === undefined) {
        throw new RangeError(`Gaussian LOD level ${level} does not exist`);
      }
      destination.push(this.packing.nodeIds[entry]!);
    }

    const center = new Vector3();
    const size = new Vector3();
    const matrix = new Matrix4();
    for (let level = 0; level < nodeIdsByLevel.length; level++) {
      const nodeIds = nodeIdsByLevel[level]!;
      if (nodeIds.length === 0) continue;
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({
        color: this.colors[level % this.colors.length],
        opacity: this.opacity,
        transparent: this.opacity < 1,
        depthTest: this.depthTest,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
        wireframe: this.wireframe,
      });
      const mesh = new InstancedMesh(geometry, material, nodeIds.length);
      for (let instance = 0; instance < nodeIds.length; instance++) {
        const bounds = this.lod.octree.nodes[nodeIds[instance]!]!.bounds;
        bounds.getCenter(center);
        bounds.getSize(size);
        matrix.makeScale(size.x, size.y, size.z);
        matrix.setPosition(center);
        mesh.setMatrixAt(instance, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.name = `Gaussian LOD ${level} volumes`;
      mesh.renderOrder = 900 + level;
      mesh.userData.lodLevel = level;
      this.levelMeshes.set(level, mesh);
      this.add(mesh);
    }
  }

  private disposeMeshes(): void {
    for (const mesh of this.levelMeshes.values()) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.levelMeshes.clear();
  }
}
