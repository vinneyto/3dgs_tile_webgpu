import type { PackingStrategy } from "../PackingStrategy";
import type { Command } from "./Command";

export interface SetCloudPackingCommand extends Command<"set-cloud-packing"> {
  cloudId: string;
  packingStrategy: PackingStrategy;
}
