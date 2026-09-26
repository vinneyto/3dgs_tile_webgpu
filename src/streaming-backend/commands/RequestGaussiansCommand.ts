import type { FrontendCapabilities } from "../BackendConfig";
import type { Command } from "./Command";

/** Request the rendering buffers for a particular view and frontend. */
export interface RequestGaussiansCommand extends Command<"request-gaussians"> {
  sceneRevision: number;
  /** Column-major camera-to-world transform. */
  worldMatrix: readonly number[];
  /** Column-major projection transform. */
  projectionMatrix: readonly number[];
  frontend: FrontendCapabilities;
}
