import {
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  WebGPURenderer,
} from "three/webgpu";
import { float, vec3 } from "three/tsl";
import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianPass } from "../src/renderer/GaussianPass";
import { gaussianPositionLocal } from "../src/renderer/nodes/GaussianContextNodes";
import { packedStore } from "../test/helpers/packedStore";

window.runQa = async () => {
  const renderer = new WebGPURenderer();
  renderer.setSize(32, 32);
  await renderer.init();
  const errors = [];
  renderer.backend.device.addEventListener("uncapturederror", (event) =>
    errors.push(event.error.message),
  );
  const attr = (values) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  const model = () =>
    new GaussianData(
      {
        means: attr([1, 2, -3, 0]),
        scalesOpacity: attr([1, 2, 3, 0.8]),
        rotations: attr([0, 0, 0, 1]),
        shCoefficients: attr([0, 0, 0, 0]),
      },
      { count: 1 },
    );
  const fixture = packedStore(model());
  const first = fixture.cloud,
    second = fixture.add(model());
  new Scene().add(first, second);
  first.position.set(3, 4, 5);
  first.scale.set(2, 3, 4);
  second.position.x = -2;
  second.material.positionLocalNode = gaussianPositionLocal.add(vec3(1, 0, 0));
  second.material.colorNode = vec3(0.2, 0.4, 0.6);
  const pass = new GaussianPass(
    renderer,
    new PerspectiveCamera(),
    fixture.store,
    {
      dataMode: "external",
      redrawStrategy: "auto",
      outputDepth: true,
      initialIntersectionCapacity: 4096,
      maxIntersectionCapacity: 4096,
      radixBackend: "workgroup",
      rasterChunkSize: null,
    },
  );
  const snapshots = [];
  const read = async () => {
    pass.render();
    const resources = pass.getResources();
    if (!resources) throw new Error("Pass did not allocate resources");
    const values = new Float32Array(
      await renderer.getArrayBufferAsync(resources.worldGaussians),
    );
    const current = [...values.slice(0, resources.worldGaussianCount * 16)];
    snapshots.push(current);
    return current;
  };
  const check = (actual, expected) => {
    if (
      actual.length !== expected.length ||
      actual.some((v, i) => Math.abs(v - expected[i]) > 1e-4)
    ) {
      throw new Error(
        `Readback mismatch: ${JSON.stringify({ actual, expected })}`,
      );
    }
  };
  try {
    const one = [5, 10, -7, 0.8, 4, 0, 0, 36, 0, 144, 1, 0, 0.5, 0.5, 0.5, 0];
    const two = [
      0,
      2,
      -3,
      0.8,
      1,
      0,
      0,
      4,
      0,
      9,
      1 + 1 / 8388608,
      0,
      0.2,
      0.4,
      0.6,
      0,
    ];
    check(await read(), [...one, ...two]);
    first.visible = false;
    check(await read(), two);
    second.material.opacityNode = float(0.25);
    second.material.needsUpdate = true;
    two[3] = 0.25;
    check(await read(), two);
    first.visible = true;
    check(await read(), [...one, ...two]);
    await renderer.backend.device.queue.onSubmittedWorkDone();
    if (errors.length) throw new Error(errors.join("\n"));
    return { passed: true, snapshots, errors };
  } finally {
    pass.dispose();
    fixture.store.dispose();
    renderer.dispose();
  }
};
document.querySelector("button").onclick = async () => {
  const output = document.querySelector("pre");
  output.textContent = "Running...";
  try {
    output.textContent = JSON.stringify(await window.runQa(), null, 2);
  } catch (error) {
    output.textContent = error.stack ?? String(error);
  }
};
