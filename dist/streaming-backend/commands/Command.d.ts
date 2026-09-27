export interface Command<T extends string> {
    type: T;
    id: string;
    /** Replace an older pending command with the same key. In-flight commands are immutable. */
    latestKey?: string;
}
