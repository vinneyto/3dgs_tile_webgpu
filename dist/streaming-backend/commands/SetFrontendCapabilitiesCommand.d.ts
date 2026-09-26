import type { Command } from "./Command";
import type { FrontendCapabilities } from "../FrontendCapabilities";
/** Enables render output once the consumer knows its device limits. */
export interface SetFrontendCapabilitiesCommand extends Command<"set-frontend-capabilities"> {
    capabilities: FrontendCapabilities;
}
