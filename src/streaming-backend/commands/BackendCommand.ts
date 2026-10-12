import type { LoadCloudCommand } from "./LoadCloudCommand";
import type { LoadCloudFromBufferCommand } from "./LoadCloudFromBufferCommand";
import type { UnloadCloudCommand } from "./UnloadCloudCommand";
import type { SetCloudPriorityCommand } from "./SetCloudPriorityCommand";
import type { SetCloudMipmapsCommand } from "./SetCloudMipmapsCommand";
import type { SetCloudTransformCommand } from "./SetCloudTransformCommand";
import type { WriteAttributeRangeCommand } from "./WriteAttributeRangeCommand";
import type { SetCameraCommand } from "./SetCameraCommand";
import type { SetFrontendCapabilitiesCommand } from "./SetFrontendCapabilitiesCommand";

import type { RecheckLodCommand } from "./RecheckLodCommand";
import type { PrefetchCacheCommand } from "./PrefetchCacheCommand";

export type BackendCommand =
  | RecheckLodCommand
  | PrefetchCacheCommand
  | LoadCloudCommand
  | LoadCloudFromBufferCommand
  | UnloadCloudCommand
  | SetCloudPriorityCommand
  | SetCloudMipmapsCommand
  | SetCloudTransformCommand
  | WriteAttributeRangeCommand
  | SetCameraCommand
  | SetFrontendCapabilitiesCommand;
