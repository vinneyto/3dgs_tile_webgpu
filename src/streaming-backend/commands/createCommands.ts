import type { CloudLoadOptions } from "../CloudLoadOptions";
import type { FrontendCapabilities } from "../FrontendCapabilities";
import type { MipmapConfig } from "../MipmapConfig";
import type { LoadCloudCommand } from "./LoadCloudCommand";
import type { LoadCloudFromBufferCommand } from "./LoadCloudFromBufferCommand";
import type { UnloadCloudCommand } from "./UnloadCloudCommand";
import type { SetCloudPriorityCommand } from "./SetCloudPriorityCommand";
import type { SetCloudMipmapsCommand } from "./SetCloudMipmapsCommand";
import type { SetCloudTransformCommand } from "./SetCloudTransformCommand";
import type { WriteAttributeRangeCommand } from "./WriteAttributeRangeCommand";
import type { SetCameraCommand } from "./SetCameraCommand";
import type { SetFrontendCapabilitiesCommand } from "./SetFrontendCapabilitiesCommand";

export const createLoadCloudCommand = (
  id: string,
  cloudId: string,
  url: string,
  options?: CloudLoadOptions,
): LoadCloudCommand => ({ type: "load-cloud", id, cloudId, url, options });
export const createLoadCloudFromBufferCommand = (
  id: string,
  cloudId: string,
  buffer: ArrayBuffer,
  options?: CloudLoadOptions,
): LoadCloudFromBufferCommand => ({
  type: "load-cloud-from-buffer",
  id,
  cloudId,
  buffer,
  options,
});
export const createUnloadCloudCommand = (
  id: string,
  cloudId: string,
): UnloadCloudCommand => ({ type: "unload-cloud", id, cloudId });
export const createSetCloudPriorityCommand = (
  id: string,
  cloudId: string,
  priority: number,
): SetCloudPriorityCommand => ({
  type: "set-cloud-priority",
  id,
  cloudId,
  priority,
});
export const createSetCloudMipmapsCommand = (
  id: string,
  cloudId: string,
  mipmaps: MipmapConfig,
): SetCloudMipmapsCommand => ({
  type: "set-cloud-mipmaps",
  id,
  cloudId,
  mipmaps,
});
export const createSetCloudTransformCommand = (
  id: string,
  cloudId: string,
  sceneRevision: number,
  worldMatrix: readonly number[],
): SetCloudTransformCommand => ({
  type: "set-cloud-transform",
  id,
  cloudId,
  sceneRevision,
  worldMatrix,
  latestKey: `cloud-transform:${cloudId}`,
});
export const createWriteAttributeRangeCommand = (
  id: string,
  cloudId: string,
  attribute: string,
  firstGaussian: number,
  gaussianCount: number,
  data: ArrayBuffer,
): WriteAttributeRangeCommand => ({
  type: "write-attribute-range",
  id,
  cloudId,
  attribute,
  firstGaussian,
  gaussianCount,
  data,
});
export const createSetCameraCommand = (
  id: string,
  sceneRevision: number,
  worldMatrix: readonly number[],
  projectionMatrix: readonly number[],
  viewportWidth = 1,
  viewportHeight = 1,
): SetCameraCommand => ({
  type: "set-camera",
  id,
  sceneRevision,
  worldMatrix,
  projectionMatrix,
  viewportWidth,
  viewportHeight,
  latestKey: "camera",
});
export const createSetFrontendCapabilitiesCommand = (
  id: string,
  capabilities: FrontendCapabilities,
  sceneRevision: number,
  cameraWorldMatrix: readonly number[],
  projectionMatrix: readonly number[],
  cloudTransforms: readonly {
    cloudId: string;
    worldMatrix: readonly number[];
  }[],
  viewportWidth = 1,
  viewportHeight = 1,
): SetFrontendCapabilitiesCommand => ({
  type: "set-frontend-capabilities",
  id,
  protocolVersion: 2,
  capabilities: { ...capabilities },
  sceneRevision,
  cameraWorldMatrix,
  projectionMatrix,
  cloudTransforms,
  viewportWidth,
  viewportHeight,
});
