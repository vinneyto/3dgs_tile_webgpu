/** Observable backend events. Consumers can narrow by `type`. */
export interface GaussianBackendEvents {
    changed: {
        readonly type: "changed";
        readonly reason: "clouds" | "layout" | "content";
    };
    error: {
        readonly type: "error";
        readonly error: Error;
    };
}
export type GaussianBackendEvent = GaussianBackendEvents[keyof GaussianBackendEvents];
export type GaussianBackendListener = (event: GaussianBackendEvent) => void;
