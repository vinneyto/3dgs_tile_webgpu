import type { Command } from "./Command";
import type { FrontendCapabilities } from "../FrontendCapabilities";
/** Enables render output once the consumer knows its device limits. */
export interface SetFrontendCapabilitiesCommand extends Command<"set-frontend-capabilities"> {
    protocolVersion: 1;
    capabilities: FrontendCapabilities;
    sceneRevision: number;
    cameraWorldMatrix: readonly number[];
    projectionMatrix: readonly number[];
    cloudTransforms: readonly {
        cloudId: string;
        worldMatrix: readonly number[];
    }[];
}
