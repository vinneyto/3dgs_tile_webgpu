import type { PackingStrategy } from "../PackingStrategy";
export interface SetCloudPackingCommand {
    type: "set-cloud-packing";
    id: string;
    cloudId: string;
    packingStrategy: PackingStrategy;
}
