import type { CloudLoadOptions } from "../CloudLoadOptions";
export interface LoadCloudCommand {
  type: "load-cloud";
  id: string;
  cloudId: string;
  url: string;
  options?: CloudLoadOptions;
}
