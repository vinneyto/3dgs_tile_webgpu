/** A failure of the backend transport or worker outside a specific command. */
export interface BackendFailureEvent {
    type: "backend-failure";
    commandId?: string;
    code: string;
    message: string;
}
