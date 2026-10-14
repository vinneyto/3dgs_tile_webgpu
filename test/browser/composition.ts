import {
  WebGPURenderer,
  PerspectiveCamera,
  Scene,
  StorageBufferAttribute,
  Vector3,
} from "three/webgpu";
import {
  Fn,
  instanceIndex,
  storage,
  textureLoad,
  uvec2,
  uint,
  uniform,
  vec3,
} from "three/tsl";
import {
  GaussianData,
  GaussianTransformPass,
  GaussianProjectionPass,
  GaussianOrderingPass,
  GaussianIntersectionPass,
  GaussianRasterPass,
  composeGaussianPass,
  gaussianPass,
  gaussianPositionLocal,
} from "../../src/index";
import { packedStore } from "../helpers/packedStore";

(window as any).runQa = async () => {
  const renderer = new WebGPURenderer();
  renderer.setSize(64, 64);
  await renderer.init();
  const device = (renderer.backend as any).device;
  const errors: string[] = [];
  device.addEventListener("uncapturederror", (e: any) =>
    errors.push(e.error.message),
  );
  device.pushErrorScope("validation");
  const attr = (values: number[]) =>
    new StorageBufferAttribute(new Float32Array(values), 4);
  const source = () =>
    new GaussianData(
      {
        means: attr([0, 0, -4, 0]),
        scalesOpacity: attr([0.2, 0.3, 0.4, 0.9]),
        rotations: attr([0, 0, 0, 1]),
        shCoefficients: attr([0.2, 0.4, 0.6, 0]),
      },
      { count: 1, activeSlots: new Uint32Array([0]), ownsBuffers: true },
    );
  const fixture = packedStore(source());
  const scene = new Scene();
  scene.add(fixture.cloud);
  const camera = new PerspectiveCamera(50, 1, 0.01, 100);
  const data = new GaussianTransformPass(fixture.store);
  const offset = uniform(new Vector3());
  data.nodes.positionNode = gaussianPositionLocal.add(offset);
  const secondData = new GaussianTransformPass(data.output);
  secondData.nodes.positionNode = gaussianPositionLocal.add(vec3(0.25, 0, 0));
  const chainedProjection = new GaussianProjectionPass(secondData.output);
  const chainedOrdering = new GaussianOrderingPass(
    secondData.output,
    chainedProjection.output,
  );
  const chainedIntersections = new GaussianIntersectionPass(
    secondData.output,
    chainedProjection.output,
    chainedOrdering.output,
  );
  const chainedRaster = new GaussianRasterPass(
    secondData.output,
    chainedProjection.output,
    chainedIntersections.output,
  );
  const projection = new GaussianProjectionPass(data.output);
  const ordering = new GaussianOrderingPass(data.output, projection.output);
  const intersections = new GaussianIntersectionPass(
    data.output,
    projection.output,
    ordering.output,
  );
  const raster = new GaussianRasterPass(
    data.output,
    projection.output,
    intersections.output,
  );
  const options = {
    dataMode: "external" as const,
    intersectionCapacity: 4096,
    redrawStrategy: "auto" as const,
    rasterChunkSize: null,
  };
  const transformed = composeGaussianPass(
    renderer,
    camera,
    { data, projection, ordering, intersections, raster },
    options,
  );
  const standard = gaussianPass(renderer, camera, fixture.store, options);
  const capture = async (pass: any) => {
    const buffer = new StorageBufferAttribute(new Float32Array(64 * 64 * 4), 4);
    const out = storage(buffer, "vec4", 64 * 64);
    const kernel = Fn(() =>
      out
        .element(instanceIndex)
        .assign(
          textureLoad(
            pass.colorTexture,
            uvec2(instanceIndex.mod(uint(64)), instanceIndex.div(uint(64))),
          ),
        ),
    )().compute(64 * 64);
    renderer.compute(kernel);
    const result = new Float32Array(await renderer.getArrayBufferAsync(buffer));
    kernel.dispose();
    buffer.dispose();
    return result;
  };
  transformed.render();
  standard.render();
  const a = await capture(transformed),
    b = await capture(standard);
  const difference = a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i]!)), 0);
  offset.value.set(0.5, 0, 0);
  data.invalidate();
  transformed.render();
  const moved = Array.from(
    new Float32Array(
      await renderer.getArrayBufferAsync(data.output.read().means),
    ),
  );
  const shape = Array.from(
    new Float32Array(
      await renderer.getArrayBufferAsync(data.output.read().scalesOpacity),
    ),
  );
  data.nodes.positionNode = gaussianPositionLocal.add(vec3(1, 0, 0));
  transformed.render();
  const changed = Array.from(
    new Float32Array(
      await renderer.getArrayBufferAsync(data.output.read().means),
    ),
  );
  const cloud2 = fixture.add(source());
  scene.add(cloud2);
  transformed.render();
  const grown = Array.from(
    new Float32Array(
      await renderer.getArrayBufferAsync(data.output.read().means),
    ),
  );
  const stats = await transformed.readStats();
  transformed.dispose();
  standard.dispose();
  const chained = composeGaussianPass(
    renderer,
    camera,
    {
      data: secondData,
      projection: chainedProjection,
      ordering: chainedOrdering,
      intersections: chainedIntersections,
      raster: chainedRaster,
    },
    options,
  );
  chained.render();
  const chainedMeans = Array.from(
    new Float32Array(
      await renderer.getArrayBufferAsync(secondData.output.read().means),
    ),
  );
  const scope = await device.popErrorScope();
  chained.dispose();
  fixture.store.dispose();
  renderer.dispose();
  return {
    difference,
    moved,
    shape,
    changed,
    grown,
    chainedMeans,
    stats,
    errors,
    scope: scope?.message ?? null,
  };
};
