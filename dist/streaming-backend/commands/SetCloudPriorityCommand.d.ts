export interface SetCloudPriorityCommand {
    type: "set-cloud-priority";
    id: string;
    cloudId: string;
    priority: number;
}
