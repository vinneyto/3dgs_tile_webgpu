import type { Command } from "./Command";
export interface SetCloudPriorityCommand extends Command<"set-cloud-priority"> {
    cloudId: string;
    priority: number;
}
