import {
  Color,
  type ColorRepresentation,
  type Node,
  type StorageBufferAttribute,
} from "three/webgpu";
import { float, mix, storage, uint, vec3 } from "three/tsl";

import type { GaussianPass } from "./GaussianPass";
import { rasterGaussianIndex } from "./nodes/GaussianContextNodes";
import type { GaussianStorePackedAttribute } from "./store-attributes";

export interface GaussianLodColorHelperOptions {
  /** Coarsest-to-finest colors. Extra LOD levels cycle the palette. */
  colors?: readonly ColorRepresentation[];
  /** Amount of LOD tint mixed into the rendered Gaussian color. Defaults to 0.45. */
  tintStrength?: number;
  /** Defaults to true. */
  enabled?: boolean;
}

const DEFAULT_COLORS: readonly ColorRepresentation[] = [
  0xe85d68, 0xf2b84b, 0x4ac58b,
];

/** Tints GaussianPass raster color with a packed current-LOD debug palette. */
export class GaussianLodColorHelper {
  readonly isGaussianLodColorHelper = true;
  readonly lodLevelAttribute: GaussianStorePackedAttribute;
  readonly tintStrength: number;

  private readonly colors: readonly ColorRepresentation[];
  private baseColorNode: Node | null = null;
  private helperColorNode: Node | null = null;
  private boundBuffer: StorageBufferAttribute | null = null;
  private readonly unsubscribeDebug: () => void;
  private active = false;
  private disposed = false;

  constructor(
    readonly pass: GaussianPass,
    options: GaussianLodColorHelperOptions = {},
  ) {
    if (options.colors !== undefined && options.colors.length === 0) {
      throw new RangeError("Gaussian LOD color palette must not be empty");
    }
    const tintStrength = options.tintStrength ?? 0.45;
    if (
      !Number.isFinite(tintStrength) ||
      tintStrength < 0 ||
      tintStrength > 1
    ) {
      throw new RangeError(
        "Gaussian LOD tint strength must be between 0 and 1",
      );
    }
    this.colors = [...(options.colors ?? DEFAULT_COLORS)];
    this.tintStrength = tintStrength;
    this.lodLevelAttribute = pass.gaussianStore.enablePackedLodLevelAttribute();
    this.unsubscribeDebug = pass.subscribeDebug(() => this.update());
    this.enabled = options.enabled ?? true;
  }

  get enabled(): boolean {
    return this.active;
  }

  set enabled(value: boolean) {
    this.assertUsable();
    if (value === this.active) return;
    if (value) {
      this.baseColorNode = this.pass.rasterColorNode;
      this.active = true;
      if (this.lodLevelAttribute.isAllocated) this.rebuildColorNode();
      return;
    }
    if (this.pass.rasterColorNode === this.helperColorNode) {
      this.pass.rasterColorNode = this.baseColorNode!;
    }
    this.active = false;
    this.baseColorNode = null;
    this.helperColorNode = null;
    this.boundBuffer = null;
  }

  /** Refresh after store.pack(); only a replaced backing buffer rebuilds the node. */
  update(): void {
    this.assertUsable();
    if (!this.active || !this.lodLevelAttribute.isAllocated) return;
    if (this.lodLevelAttribute.bufferAttribute !== this.boundBuffer) {
      this.rebuildColorNode();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.unsubscribeDebug();
    if (this.active && this.pass.rasterColorNode === this.helperColorNode) {
      this.pass.rasterColorNode = this.baseColorNode!;
    }
    this.active = false;
    this.baseColorNode = null;
    this.helperColorNode = null;
    this.boundBuffer = null;
    this.disposed = true;
  }

  private rebuildColorNode(): void {
    const attribute = this.lodLevelAttribute.bufferAttribute;
    const level = storage(attribute, "uint", attribute.count)
      .toReadOnly()
      .element(rasterGaussianIndex)
      .mod(uint(this.colors.length));
    const palette = this.colors.map((value) => {
      const rgb = new Color(value).getRGB(
        { r: 0, g: 0, b: 0 },
        this.pass.colorSpace,
      );
      return vec3(rgb.r, rgb.g, rgb.b);
    });
    let tint: Node<"vec3"> = palette[palette.length - 1]!;
    for (let index = palette.length - 2; index >= 0; index--) {
      tint = level.equal(uint(index)).select(palette[index]!, tint);
    }
    const color = mix(
      this.baseColorNode! as Node<"vec3">,
      tint,
      float(this.tintStrength),
    );
    this.boundBuffer = attribute;
    this.helperColorNode = color;
    this.pass.rasterColorNode = color;
  }

  private assertUsable(): void {
    if (this.disposed) {
      throw new Error("GaussianLodColorHelper has been disposed");
    }
  }
}
