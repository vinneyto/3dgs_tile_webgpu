import type { LoadCloudCommand } from "./LoadCloudCommand";
import type { LoadCloudFromBufferCommand } from "./LoadCloudFromBufferCommand";
import type { UnloadCloudCommand } from "./UnloadCloudCommand";
import type { SetCloudPriorityCommand } from "./SetCloudPriorityCommand";
import type { SetCloudPackingCommand } from "./SetCloudPackingCommand";
import type { SetCloudTransformCommand } from "./SetCloudTransformCommand";
import type { SetCloudRaycastableCommand } from "./SetCloudRaycastableCommand";
import type { WriteAttributeRangeCommand } from "./WriteAttributeRangeCommand";
import type { SetCameraCommand } from "./SetCameraCommand";
import type { SetFrontendCapabilitiesCommand } from "./SetFrontendCapabilitiesCommand";
import type { CancelCommand } from "./CancelCommand";

export type BackendCommand =
  | LoadCloudCommand
  | LoadCloudFromBufferCommand
  | UnloadCloudCommand
  | SetCloudPriorityCommand
  | SetCloudPackingCommand
  | SetCloudTransformCommand
  | SetCloudRaycastableCommand
  | WriteAttributeRangeCommand
  | SetCameraCommand
  | SetFrontendCapabilitiesCommand
  | CancelCommand;
