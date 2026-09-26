export interface SetCloudTransformCommand {
  type: "set-cloud-transform";
  id: string;
  cloudId: string;
  sceneRevision: number;
  /** Column-major 4x4 world transform, with exactly sixteen elements. */
  worldMatrix: readonly number[];
}
