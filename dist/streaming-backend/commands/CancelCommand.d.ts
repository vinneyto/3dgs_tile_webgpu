export interface CancelCommand {
    type: "cancel";
    id: string;
    targetCommandId: string;
}
