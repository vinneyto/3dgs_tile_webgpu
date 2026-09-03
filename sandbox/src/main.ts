import "./style.css";
import { GaussianSandbox } from "./GaussianSandbox";
import { SandboxUi } from "./SandboxUi";

const viewport = document.querySelector<HTMLElement>("#viewport");
const status = document.querySelector<HTMLElement>("#status");
const metrics = document.querySelector<HTMLElement>("#metrics");
const kernelTimings = document.querySelector<HTMLElement>("#kernel-timings");
const kernelProfile =
  document.querySelector<HTMLDetailsElement>("#kernel-profile");
const openButton = document.querySelector<HTMLButtonElement>("#open-ply");
const fileInput = document.querySelector<HTMLInputElement>("#ply-file");
const octreeToggle = document.querySelector<HTMLInputElement>("#show-octree");
const lodColorToggle = document.querySelector<HTMLInputElement>(
  "#color-splats-by-lod",
);

if (
  viewport === null ||
  status === null ||
  metrics === null ||
  kernelTimings === null ||
  kernelProfile === null ||
  openButton === null ||
  fileInput === null ||
  octreeToggle === null ||
  lodColorToggle === null
) {
  throw new Error("Sandbox markup is incomplete");
}

const parameters = new URLSearchParams(location.search);
kernelProfile.open = parameters.get("profile") === "kernels";

const sandbox = await GaussianSandbox.create(
  viewport,
  status,
  metrics,
  kernelTimings,
);
const ui = new SandboxUi(sandbox, {
  openButton,
  fileInput,
  octreeToggle,
  lodColorToggle,
});

import.meta.hot?.dispose(() => {
  ui.dispose();
  sandbox.dispose();
});

await sandbox.loadUrl(parameters.get("ply") ?? "/sample.ply");
