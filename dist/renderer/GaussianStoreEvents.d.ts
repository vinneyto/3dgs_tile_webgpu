/** Notifications about the client's synchronous rendering view. */
export interface GaussianStoreEvents {
    changed: {
        readonly type: "changed";
        readonly reason: "clouds" | "layout" | "content";
    };
    error: {
        readonly type: "error";
        readonly error: Error;
    };
}
export type GaussianStoreEvent = GaussianStoreEvents[keyof GaussianStoreEvents];
export type GaussianStoreListener = (event: GaussianStoreEvent) => void;
