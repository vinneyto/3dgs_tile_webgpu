import "./style.css";
import { GaussianSandbox } from "./GaussianSandbox";

const viewport = document.querySelector<HTMLElement>("#viewport");
const status = document.querySelector<HTMLElement>("#status");
const metrics = document.querySelector<HTMLElement>("#metrics");
const kernelTimings = document.querySelector<HTMLElement>("#kernel-timings");
const openButton = document.querySelector<HTMLButtonElement>("#open-ply");
const fileInput = document.querySelector<HTMLInputElement>("#ply-file");
const octreeToggle = document.querySelector<HTMLInputElement>("#show-octree");
const lodToggles = Array.from(
  document.querySelectorAll<HTMLInputElement>("[data-lod-level]"),
);

if (
  viewport === null ||
  status === null ||
  metrics === null ||
  kernelTimings === null ||
  openButton === null ||
  fileInput === null ||
  octreeToggle === null ||
  lodToggles.length === 0
) {
  throw new Error("Sandbox markup is incomplete");
}

const sandbox = await GaussianSandbox.create(
  viewport,
  status,
  metrics,
  kernelTimings,
);

const applySpatialDebugState = () => {
  sandbox.setOctreeHelperVisible(octreeToggle.checked);
  sandbox.setLodHelperLevels(
    lodToggles
      .filter((candidate) => candidate.checked)
      .map((candidate) => Number(candidate.dataset.lodLevel)),
  );
};

octreeToggle.addEventListener("change", applySpatialDebugState);
for (const toggle of lodToggles)
  toggle.addEventListener("change", applySpatialDebugState);

applySpatialDebugState();
const parameters = new URLSearchParams(location.search);
await sandbox.loadUrl(parameters.get("ply") ?? "/sample.ply");

openButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file !== undefined) void sandbox.loadFile(file);
  fileInput.value = "";
});

addEventListener("dragenter", (event) => {
  event.preventDefault();
  document.body.dataset.dragging = "true";
});
addEventListener("dragover", (event) => event.preventDefault());
addEventListener("dragleave", (event) => {
  if (event.relatedTarget === null) delete document.body.dataset.dragging;
});
addEventListener("drop", (event) => {
  event.preventDefault();
  delete document.body.dataset.dragging;
  const file = event.dataTransfer?.files[0];
  if (file !== undefined) void sandbox.loadFile(file);
});
