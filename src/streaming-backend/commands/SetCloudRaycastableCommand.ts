export interface SetCloudRaycastableCommand {
  type: "set-cloud-raycastable";
  id: string;
  cloudId: string;
  raycastable: boolean;
}
