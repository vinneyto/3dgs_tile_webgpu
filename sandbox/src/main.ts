import "./style.css";

import {
  PerspectiveCamera,
  RenderPipeline,
  Sphere,
  WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GaussianStore, gaussianPass } from "3dgs-tile-webgpu";

const viewport = document.querySelector<HTMLElement>("#viewport")!;
const status = document.querySelector<HTMLElement>("#status")!;
const metrics = document.querySelector<HTMLElement>("#metrics")!;
const plyUrl = new URLSearchParams(location.search).get("ply") ?? "/sample.ply";

if (!navigator.gpu) throw new Error("WebGPU is unavailable in this browser");

const renderer = new WebGPURenderer({ antialias: false });
await renderer.init();
renderer.setSize(innerWidth, innerHeight);
viewport.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(
  50,
  innerWidth / innerHeight,
  0.01,
  10_000,
);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Package integration: CPU data now, GPU allocation and LOD updates lazily
// during pipeline.render(). No GPUDevice or manual Store packing is needed.
const store = new GaussianStore();
status.textContent = `Loading ${plyUrl}…`;
const cloud = await store.load(plyUrl);

const bounds = cloud.lod!.octree.bounds.getBoundingSphere(new Sphere());
const radius = Math.max(bounds.radius, 0.1);
camera.near = Math.max(radius / 10_000, 0.0001);
camera.far = Math.max(radius * 20, 100);
camera.position.set(
  bounds.center.x + radius * 0.15,
  bounds.center.y + radius * 0.35,
  bounds.center.z + radius * 2.4,
);
camera.updateProjectionMatrix();
controls.target.copy(bounds.center);
controls.update();

const pass = gaussianPass(renderer, camera, store, {
  background: [0.018, 0.022, 0.032, 1],
});
const pipeline = new RenderPipeline(renderer);
pipeline.outputNode = pass;

let initialized = false;
pass.subscribeDebug(({ pass: debug, storePack, lod }) => {
  if (!initialized && debug.initialized) {
    initialized = true;
    status.textContent = `${cloud.name}: ${store.count.toLocaleString()} Gaussians`;
  }
  metrics.textContent = [
    `${debug.width}×${debug.height} · ${debug.tilesX}×${debug.tilesY} tiles`,
    `capacity ${store.maxGaussians.toLocaleString()} · LOD ${lod.pending ? "streaming" : "settled"}`,
    storePack === null
      ? "packing pending"
      : `upload ${(storePack.estimatedUploadBytes / 1024).toFixed(0)} KiB`,
  ].join("\n");
});

renderer.setAnimationLoop(() => {
  controls.update();
  pipeline.render();
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
