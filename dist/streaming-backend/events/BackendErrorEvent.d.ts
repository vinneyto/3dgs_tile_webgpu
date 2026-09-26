export interface BackendErrorEvent {
    type: "error";
    commandId?: string;
    cloudId?: string;
    code: string;
    message: string;
}
