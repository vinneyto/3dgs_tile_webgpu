import {
  type GaussianCloud,
  GaussianLodColorHelper,
  type GaussianPass,
  OctreeHelper,
} from "../../src/index";

/** Owns the optional visual helpers attached to the currently displayed cloud. */
export class SpatialDebugHelpers {
  private octreeHelper: OctreeHelper | null = null;
  private lodColorHelper: GaussianLodColorHelper | null = null;
  private octreeVisible = false;
  private lodColoringEnabled = false;

  attach(cloud: GaussianCloud, pass: GaussianPass): void {
    this.clear();
    if (cloud.lod !== null) {
      this.octreeHelper = new OctreeHelper(cloud.lod.octree, {
        opacity: 0.42,
      });
      this.octreeHelper.visible = this.octreeVisible;
      cloud.add(this.octreeHelper);
    }
    this.lodColorHelper = new GaussianLodColorHelper(pass, {
      enabled: this.lodColoringEnabled,
    });
  }

  setOctreeVisible(visible: boolean): void {
    this.octreeVisible = visible;
    if (this.octreeHelper !== null) this.octreeHelper.visible = visible;
  }

  setLodColoringEnabled(enabled: boolean): void {
    this.lodColoringEnabled = enabled;
    if (this.lodColorHelper !== null) this.lodColorHelper.enabled = enabled;
  }

  clear(): void {
    this.lodColorHelper?.dispose();
    this.lodColorHelper = null;
    this.octreeHelper?.removeFromParent();
    this.octreeHelper?.dispose();
    this.octreeHelper = null;
  }
}
