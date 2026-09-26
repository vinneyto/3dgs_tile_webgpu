export interface SetCameraCommand {
  type: "set-camera";
  id: string;
  sceneRevision: number;
  position: readonly [number, number, number];
}
