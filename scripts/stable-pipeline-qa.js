import {
  WebGPURenderer,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  WGSLNodeBuilder,
} from "three/webgpu";
import {
  Fn,
  instanceIndex,
  storage,
  textureLoad,
  uvec2,
  uint,
  vec4,
} from "three/tsl";
import { GaussianData } from "../src/renderer/GaussianData";
import { GaussianPass } from "../src/renderer/GaussianPass";
import { packedStore } from "../test/helpers/packedStore";

window.runQa = async () => {
  const renderer = new WebGPURenderer();
  renderer.setSize(16, 16);
  await renderer.init();
  const device = renderer.backend.device;
  const errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let builds = 0,
    modules = 0,
    pipelines = 0,
    groups = 0;
  const build = WGSLNodeBuilder.prototype.build;
  WGSLNodeBuilder.prototype.build = function (...a) {
    builds++;
    const node = this.object;
    if (node?.isComputeNode) {
      if (builtNodes.has(node.id)) existingNodesRebuilt++;
      builtNodes.add(node.id);
    }
    return build.apply(this, a);
  };
  let fixture, pass, reference;
  const explicitWarmup = new URLSearchParams(location.search).has("warmup");
  const dispatch = GPUComputePassEncoder.prototype.dispatchWorkgroups;
  let zeroDispatches = 0;
  GPUComputePassEncoder.prototype.dispatchWorkgroups = function (
    x,
    y = 1,
    z = 1,
  ) {
    if (x === 0 || y === 0 || z === 0) zeroDispatches++;
    return dispatch.call(this, x, y, z);
  };
  const builtNodes = new Set();
  let existingNodesRebuilt = 0;
  const originalMethods = new Map();
  try {
    for (const [method, counter] of [
      ["createShaderModule", () => modules++],
      ["createComputePipeline", () => pipelines++],
      ["createBindGroup", () => groups++],
    ]) {
      const original = device[method].bind(device);
      originalMethods.set(method, device[method]);
      device[method] = (...a) => {
        counter();
        return original(...a);
      };
    }
    const counts = () => ({ builds, modules, pipelines, groups });
    const model = (count, degree = 0) => {
      const attr = (v) =>
        new StorageBufferAttribute(
          new Float32Array(Array.from({ length: count }, () => v).flat()),
          4,
        );
      return new GaussianData(
        {
          means: attr([0, 0, -4, 0]),
          scalesOpacity: attr([0.1, 0.1, 0.1, 0.4]),
          rotations: attr([0, 0, 0, 1]),
          shCoefficients: new StorageBufferAttribute(
            new Float32Array(count * (degree + 1) ** 2 * 4).fill(0.2),
            4,
          ),
        },
        {
          count,
          shDegree: degree,
          activeSlots: new Uint32Array(
            Array.from({ length: count }, (_, i) => i),
          ),
        },
      );
    };
    fixture = packedStore(model(1), false);
    const scene = new Scene();
    scene.add(fixture.cloud);
    const camera = new PerspectiveCamera(50, 1, 0.01, 100);
    pass = new GaussianPass(renderer, camera, fixture.store, {
      dataMode: "external",
      outputDepth: true,
      initialIntersectionCapacity: 128,
      maxIntersectionCapacity: 100_000,
      radixBackend: "workgroup",
      rasterChunkSize: 256,
      redrawStrategy: "auto",
      intersectionReadbackInterval: 0,
    });
    if (explicitWarmup) await pass.warmup({ geometryFormat: "float32" });
    fixture.request();
    const records = [];
    let firstEncodedFrameMs;
    const confirmationStart = performance.now();
    const settle = async () => {
      for (let i = 0; i < 8; i++) {
        const start = performance.now();
        pass.render();
        if (firstEncodedFrameMs === undefined)
          firstEncodedFrameMs = performance.now() - start;
        await pass.readStats();
        await new Promise((r) => setTimeout(r, 5));
        if (pass.getOutputStatus().fresh) break;
      }
    };
    await settle();
    const firstConfirmedFrameMs = performance.now() - confirmationStart;
    const graph = pass.pipeline;
    const ids = graph.getComputeNodes().map((n) => n.id);
    const warmed = counts();
    records.push({
      phase: "first",
      counts: counts(),
      status: pass.getOutputStatus(),
    });
    for (const [count, degree] of [
      [600, 1],
      [800, 2],
    ]) {
      scene.add(fixture.add(model(count, degree)));
      await settle();
      records.push({
        phase: `add-${count}-degree-${degree}`,
        counts: counts(),
        status: pass.getOutputStatus(),
        graphSame: pass.pipeline === graph,
        idsSame: graph.getComputeNodes().every((n, i) => n.id === ids[i]),
      });
    }
    renderer.setSize(80, 16);
    pass.setFixedSize(80, 16);
    await settle();
    renderer.setSize(640, 16);
    pass.setFixedSize(640, 16);
    await settle();
    records.push({
      phase: "resize-and-sort-parity",
      status: pass.getOutputStatus(),
      counts: counts(),
      graphSame: pass.pipeline === graph,
      idsSame: graph.getComputeNodes().every((n, i) => n.id === ids[i]),
    });
    const capture = async (p) => {
      const width = 640,
        height = 16,
        b = new StorageBufferAttribute(new Float32Array(width * height * 8), 4),
        out = storage(b, "vec4", width * height * 2);
      const k = Fn(() => {
        const px = uvec2(
          instanceIndex.mod(uint(width)),
          instanceIndex.div(uint(width)),
        );
        out
          .element(instanceIndex.mul(2))
          .assign(textureLoad(p.colorTexture, px));
        out
          .element(instanceIndex.mul(2).add(1))
          .assign(vec4(textureLoad(p.depthTexture, px).r, 0, 0, 0));
      })().compute(width * height);
      renderer.compute(k);
      const result = new Float32Array(await renderer.getArrayBufferAsync(b));
      k.dispose();
      b.dispose();
      return result;
    };
    const stable = await capture(pass);
    reference = new GaussianPass(renderer, camera, fixture.store, {
      dataMode: "external",
      outputDepth: true,
      intersectionCapacity: 100_000,
      radixBackend: "workgroup",
      rasterChunkSize: 256,
      fixedSize: { width: 640, height: 16 },
    });
    reference.render();
    const expected = await capture(reference);
    const maxDifference = stable.reduce(
      (m, v, i) => Math.max(m, Math.abs(v - expected[i])),
      0,
    );
    const stats = await pass.readStats();
    const maxAlpha = expected.reduce(
      (m, v, i) => (i % 8 === 3 ? Math.max(m, v) : m),
      0,
    );
    const minDepth = expected.reduce(
      (m, v, i) => (i % 8 === 4 ? Math.min(m, v) : m),
      1,
    );
    const stableNodes =
      pass.pipeline === graph &&
      graph.getComputeNodes().every((n, i) => n.id === ids[i]);
    const stablePipelines =
      !explicitWarmup ||
      records.every(
        (r) =>
          r.counts.builds === warmed.builds &&
          r.counts.modules === warmed.modules &&
          r.counts.pipelines === warmed.pipelines,
      );
    const existingNodesRebuiltBeforeReference = existingNodesRebuilt;
    const result = {
      explicitWarmup,
      zeroDispatches,
      firstEncodedFrameMs,
      firstConfirmedFrameMs,
      existingNodesRebuilt: existingNodesRebuiltBeforeReference,
      ok:
        stableNodes &&
        stablePipelines &&
        existingNodesRebuiltBeforeReference === 0 &&
        (explicitWarmup || zeroDispatches === 0) &&
        maxDifference === 0 &&
        maxAlpha > 0 &&
        minDepth < 1 &&
        errors.length === 0,
      warmed,
      records,
      maxDifference,
      maxAlpha,
      minDepth,
      stats,
      errors,
    };
    return result;
  } finally {
    GPUComputePassEncoder.prototype.dispatchWorkgroups = dispatch;
    WGSLNodeBuilder.prototype.build = build;
    for (const [method, original] of originalMethods) device[method] = original;
    pass?.dispose();
    reference?.dispose();
    fixture?.store.dispose();
    renderer.dispose();
  }
};
const button = document.querySelector("button"),
  output = document.querySelector("pre");
button.addEventListener("click", async () => {
  button.disabled = true;
  output.textContent = "Running…";
  try {
    output.textContent = JSON.stringify(await window.runQa(), null, 2);
  } catch (error) {
    output.textContent = error.stack ?? String(error);
  } finally {
    button.disabled = false;
  }
});
