import type { Command } from "./Command";
export interface CancelCommand extends Command<"cancel"> {
    targetCommandId: string;
}
