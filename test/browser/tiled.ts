import {
  DataUtils,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  WebGPUCoordinateSystem,
  WebGPURenderer,
  type NodeFrame,
} from "three/webgpu";
import { GaussianData, GaussianPass, GaussianStore } from "../../src/index";

const result = document.querySelector("#result")!;
async function run() {
  const renderer = new WebGPURenderer({ antialias: false });
  await renderer.init();
  if (!renderer.hasFeature("subgroups")) {
    result.textContent = "SKIPPED: adapter does not support subgroups";
    renderer.dispose();
    return;
  }
  // Partial edge tiles, multiple Gaussian batches, and pixels outside support.
  const width = 37,
    height = 29,
    count = 600;
  renderer.setSize(width, height);
  const camera = new PerspectiveCamera(60, width / height, 0.1, 100);
  camera.coordinateSystem = WebGPUCoordinateSystem;
  camera.updateProjectionMatrix();
  const device = (renderer.backend as unknown as { device: GPUDevice }).device;
  device.pushErrorScope("validation");
  const errors: string[] = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  const checks: unknown[] = [];
  for (const opacity of [0.01, 0.5]) {
    const means: number[] = [],
      scales: number[] = [],
      rotations: number[] = [],
      colors: number[] = [];
    for (let i = 0; i < count; i++) {
      means.push(((i % 7) - 3) * 0.08, ((i % 5) - 2) * 0.08, -2 - i * 0.001, 0);
      scales.push(0.3, 0.2, 0.1, opacity);
      rotations.push(0, 0, 0, 1);
      colors.push((i % 3) * 0.2, 0.1, -0.1, 0);
    }
    const attr = (a: number[]) =>
      new StorageBufferAttribute(new Float32Array(a), 4);
    const data = new GaussianData(
      {
        means: attr(means),
        scalesOpacity: attr(scales),
        rotations: attr(rotations),
        shCoefficients: attr(colors),
      },
      { count, ownsBuffers: true },
    );
    const store = new GaussianStore();
    const cloud = store.add(data);
    const scene = new Scene();
    scene.add(cloud);
    for (const rasterChunkSize of [null, 256]) {
      const images: number[][] = [];
      for (const rasterSubgroups of [false, true]) {
        const pass = new GaussianPass(renderer, camera, store, {
          rasterSubgroups,
          rasterChunkSize,
          intersectionCapacity: 16384,
          radixBackend: "workgroup",
          antialiasMode: "classic",
        });
        pass.updateBefore({ renderer } as unknown as NodeFrame);
        const pixels = await renderer.readRenderTargetPixelsAsync(
          pass.renderTarget,
          0,
          0,
          width,
          height,
        );
        images.push(Array.from(pixels as Uint16Array, DataUtils.fromHalfFloat));
        pass.dispose();
      }
      let maxError = 0;
      for (let i = 0; i < images[0]!.length; i++) {
        maxError = Math.max(
          maxError,
          Math.abs(images[0]![i]! - images[1]![i]!),
        );
      }
      const nonempty = images[0]!.some((v) => v > 0.01);
      checks.push({ opacity, rasterChunkSize, maxError, nonempty });
      if (!nonempty || !Number.isFinite(maxError) || maxError > 0.001)
        errors.push("Subgroup comparison failed");
    }
    store.dispose();
    data.dispose();
  }
  const validation = await device.popErrorScope();
  if (validation) errors.push(validation.message);
  result.textContent = JSON.stringify(
    { passed: errors.length === 0, checks, errors },
    null,
    2,
  );
  renderer.dispose();
  if (errors.length) throw new Error(errors.join("\n"));
}
run().catch((error) => {
  result.textContent += `\n${error.stack ?? error}`;
  console.error(error);
});
