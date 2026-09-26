import type { Command } from "./Command";

export interface SetCameraCommand extends Command<"set-camera"> {
  sceneRevision: number;
  position: readonly [number, number, number];
}
