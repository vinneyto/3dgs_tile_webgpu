import "./style.css";
import { GaussianSandbox } from "./GaussianSandbox";

const viewport = document.querySelector<HTMLElement>("#viewport");
const status = document.querySelector<HTMLElement>("#status");
const metrics = document.querySelector<HTMLElement>("#metrics");
const kernelTimings = document.querySelector<HTMLElement>("#kernel-timings");
const openButton = document.querySelector<HTMLButtonElement>("#open-ply");
const fileInput = document.querySelector<HTMLInputElement>("#ply-file");

if (
  viewport === null ||
  status === null ||
  metrics === null ||
  kernelTimings === null ||
  openButton === null ||
  fileInput === null
) {
  throw new Error("Sandbox markup is incomplete");
}

const sandbox = await GaussianSandbox.create(
  viewport,
  status,
  metrics,
  kernelTimings,
);
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
