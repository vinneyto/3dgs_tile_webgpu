import {
  HalfFloatType,
  Matrix4,
  Object3D,
  PassNode,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  type NodeFrame,
  type Texture,
  type WebGPURenderer,
} from "three/webgpu";
import { GaussianData } from "./GaussianData";
import {
  RADIX_BITS,
  RADIX_BLOCK_ITEMS,
  RADIX_SIZE,
  SCAN_BLOCK_ITEMS,
  TILE_SIZE,
  WORKGROUP_SIZE,
  addScanOffsetsShader,
  emitIntersectionsShader,
  prepareDispatchShader,
  projectShader,
  radixHistogramShader,
  radixScatterShader,
  rasterizeShader,
  scanBlockHistogramsShader,
  scanBlocksShader,
  scanDigitTotalsShader,
  tileOffsetShaders,
} from "./shaders";

export type DepthSortMode = "float32" | "packed16";

export interface GaussianPassOptions {
  /** Exact float32 depth, or a packed 16-bit tile + 16-bit quantized depth key. */
  depthSortMode?: DepthSortMode;
  /** Maximum emitted tile/Gaussian intersections. Buffers are allocated once at this capacity. */
  intersectionCapacity?: number;
  /** RGBA clear color composited behind the cloud. Defaults to transparent black. */
  background?: readonly [number, number, number, number];
}

export interface GaussianPassStats {
  intersectionCount: number;
  requestedIntersections: number;
  intersectionCapacity: number;
  overflow: boolean;
}

interface WebGPUBackendAccess {
  isWebGPUBackend?: boolean;
  device: GPUDevice | null;
  get(object: object): { texture?: GPUTexture };
}

interface ScanLevel {
  length: number;
  blockCount: number;
  output: GPUBuffer;
  blockSums: GPUBuffer;
  scanBindGroup: GPUBindGroup;
  addBindGroup?: GPUBindGroup;
}

interface RadixPassResources {
  histogramPipeline: GPUComputePipeline;
  histogramBindGroup: GPUBindGroup;
  scatterPipeline: GPUComputePipeline;
  scatterBindGroup: GPUBindGroup;
}

interface FloatIntersectionBuffers {
  kind: "float32";
  tileA: GPUBuffer;
  depthA: GPUBuffer;
  gaussianA: GPUBuffer;
  tileB: GPUBuffer;
  depthB: GPUBuffer;
  gaussianB: GPUBuffer;
}

interface PackedIntersectionBuffers {
  kind: "packed16";
  keyA: GPUBuffer;
  gaussianA: GPUBuffer;
  keyB: GPUBuffer;
  gaussianB: GPUBuffer;
}

type IntersectionBuffers = FloatIntersectionBuffers | PackedIntersectionBuffers;

interface CoreResources {
  device: GPUDevice;
  ownedBuffers: GPUBuffer[];
  frameUniforms: GPUBuffer;
  projectedMean: GPUBuffer;
  projectedConic: GPUBuffer;
  projectedColor: GPUBuffer;
  tileCounts: GPUBuffer;
  intersectionOffsets: GPUBuffer;
  dispatch: GPUBuffer;
  projectPipeline: GPUComputePipeline;
  projectBindGroup: GPUBindGroup;
  scanPipeline: GPUComputePipeline;
  addScanOffsetsPipeline: GPUComputePipeline;
  scanLevels: ScanLevel[];
  prepareDispatchPipeline: GPUComputePipeline;
  prepareDispatchBindGroup: GPUBindGroup;
  emitPipeline: GPUComputePipeline;
  emitBindGroup: GPUBindGroup;
  intersections: IntersectionBuffers;
  blockHistograms: GPUBuffer;
  blockPrefixes: GPUBuffer;
  digitOffsets: GPUBuffer;
  scanBlockHistogramsPipeline: GPUComputePipeline;
  scanBlockHistogramsBindGroup: GPUBindGroup;
  scanDigitTotalsPipeline: GPUComputePipeline;
  scanDigitTotalsBindGroup: GPUBindGroup;
  histogramModule: GPUShaderModule;
  scatterModule: GPUShaderModule;
}

interface TileResources {
  width: number;
  height: number;
  tilesX: number;
  tilesY: number;
  tileCount: number;
  ownedBuffers: GPUBuffer[];
  radixPasses: RadixPassResources[];
  sortedKey: GPUBuffer;
  sortedGaussianIds: GPUBuffer;
  tileOffsets: GPUBuffer;
  clearOffsetsPipeline: GPUComputePipeline;
  clearOffsetsBindGroup: GPUBindGroup;
  findBoundariesPipeline: GPUComputePipeline;
  findBoundariesBindGroup: GPUBindGroup;
  fillOffsetsPipeline: GPUComputePipeline;
  fillOffsetsBindGroup: GPUBindGroup;
  rasterizePipeline: GPUComputePipeline;
  rasterizeBindGroup: GPUBindGroup;
}

const _drawingBufferSize = new Vector2();
const _modelView = new Matrix4();
const _inverseModel = new Matrix4();
const _cameraWorldPosition = new Vector3();
const _cameraLocalPosition = new Vector3();
const FRAME_UNIFORM_BYTES = 256;
const DISPATCH_STATE_BYTES = 16;
const RADIX_DISPATCH_OFFSET = 256;
const LINEAR_DISPATCH_OFFSET = 272;
const DISPATCH_BYTES = 288;
const PROJECTED_COMPONENT_BYTES = 16;
const UINT_BYTES = 4;

function align4(size: number): number {
  return Math.max(4, Math.ceil(size / 4) * 4);
}

function storage(buffer: GPUBuffer, size?: number): GPUBufferBinding {
  return size === undefined ? { buffer } : { buffer, size: align4(size) };
}

function dispatchState(buffer: GPUBuffer): GPUBufferBinding {
  return { buffer, offset: 0, size: DISPATCH_STATE_BYTES };
}

/**
 * A single-cloud Three.js RenderPipeline pass backed by a GPU-driven tiled 3DGS renderer.
 * The anchor is an ordinary Object3D; its world matrix is the cloud's local-to-world transform.
 */
export class GaussianPass extends PassNode {
  readonly gaussianData: GaussianData;
  readonly anchor: Object3D;
  readonly depthSortMode: DepthSortMode;
  readonly intersectionCapacity: number;
  readonly background: readonly [number, number, number, number];

  private readonly ownerRenderer: WebGPURenderer;
  private core: CoreResources | null = null;
  private tiles: TileResources | null = null;
  private disposed = false;

  constructor(
    renderer: WebGPURenderer,
    camera: PerspectiveCamera,
    gaussianData: GaussianData,
    anchor: Object3D,
    options: GaussianPassOptions = {},
  ) {
    super(PassNode.COLOR, new Scene(), camera, {
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
    });

    const depthSortMode = options.depthSortMode ?? "float32";
    const intersectionCapacity =
      options.intersectionCapacity ?? gaussianData.count * 16;
    if (!Number.isInteger(intersectionCapacity) || intersectionCapacity <= 0) {
      throw new RangeError("intersectionCapacity must be a positive integer");
    }
    if (intersectionCapacity > WORKGROUP_SIZE * 65_535) {
      throw new RangeError(
        "intersectionCapacity exceeds the one-dimensional indirect dispatch limit",
      );
    }
    if (gaussianData.count > WORKGROUP_SIZE * 65_535) {
      throw new RangeError(
        "Gaussian count exceeds the one-dimensional projection dispatch limit",
      );
    }

    this.name = "GaussianPass";
    this.ownerRenderer = renderer;
    this.gaussianData = gaussianData;
    this.anchor = anchor;
    this.depthSortMode = depthSortMode;
    this.intersectionCapacity = intersectionCapacity;
    this.background = options.background ?? [0, 0, 0, 0];
    this.renderTarget.texture.name = "GaussianPass.output";
    this.renderTarget.texture.generateMipmaps = false;

    // Three.js adds STORAGE_BINDING when this flag is present while retaining
    // TEXTURE_BINDING, so the same texture can be written by compute and sampled
    // by the RenderPipeline fullscreen node.
    const storageTexture = this.renderTarget.texture as Texture & {
      isStorageTexture: boolean;
      mipmapsAutoUpdate: boolean;
    };
    storageTexture.isStorageTexture = true;
    storageTexture.mipmapsAutoUpdate = false;
  }

  override updateBefore(frame: NodeFrame): boolean | undefined {
    const renderer = frame.renderer as WebGPURenderer | null;
    if (renderer === null)
      throw new Error("GaussianPass received a NodeFrame without a renderer");
    if (this.disposed) throw new Error("GaussianPass has been disposed");
    if (renderer !== this.ownerRenderer) {
      throw new Error(
        "GaussianPass must be rendered by the WebGPURenderer passed to its constructor",
      );
    }
    if (!(this.camera instanceof PerspectiveCamera)) {
      throw new TypeError(
        "GaussianPass currently requires a PerspectiveCamera",
      );
    }

    const backend = renderer.backend as unknown as WebGPUBackendAccess;
    if (backend.isWebGPUBackend !== true || backend.device === null) {
      throw new Error(
        "GaussianPass requires an initialized WebGPURenderer with a WebGPU backend",
      );
    }

    renderer.getDrawingBufferSize(_drawingBufferSize);
    const width = Math.max(1, Math.floor(_drawingBufferSize.x));
    const height = Math.max(1, Math.floor(_drawingBufferSize.y));
    const sizeChanged =
      this.renderTarget.width !== width || this.renderTarget.height !== height;
    if (sizeChanged) this.setSize(width, height);
    this.renderTarget.texture.type = HalfFloatType;
    renderer.initRenderTarget(this.renderTarget);

    if (this.core === null)
      this.core = this.createCoreResources(backend.device);
    if (this.tiles === null || sizeChanged) {
      this.destroyTileResources();
      this.tiles = this.createTileResources(renderer, backend, width, height);
    }

    this.updateFrameUniforms(
      backend.device.queue,
      width,
      height,
      this.tiles.tilesX,
      this.tiles.tilesY,
    );
    this.encodeFrame(this.core, this.tiles);
    return undefined;
  }

  /** Optional diagnostic readback. Normal rendering never maps or reads the GPU count. */
  async readStats(): Promise<GaussianPassStats> {
    if (this.core === null) {
      return {
        intersectionCount: 0,
        requestedIntersections: 0,
        intersectionCapacity: this.intersectionCapacity,
        overflow: false,
      };
    }

    const readback = this.core.device.createBuffer({
      label: "3dgs.stats-readback",
      size: DISPATCH_BYTES,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = this.core.device.createCommandEncoder({
      label: "3dgs.read-stats",
    });
    encoder.copyBufferToBuffer(
      this.core.dispatch,
      0,
      readback,
      0,
      DISPATCH_BYTES,
    );
    this.core.device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const values = new Uint32Array(readback.getMappedRange().slice(0));
    readback.unmap();
    readback.destroy();
    return {
      intersectionCount: values[0] ?? 0,
      requestedIntersections: values[1] ?? 0,
      intersectionCapacity: this.intersectionCapacity,
      overflow: (values[3] ?? 0) !== 0,
    };
  }

  private createCoreResources(device: GPUDevice): CoreResources {
    const ownedBuffers: GPUBuffer[] = [];
    const createBuffer = (
      label: string,
      size: number,
      usage = GPUBufferUsage.STORAGE,
    ): GPUBuffer => {
      const alignedSize = align4(size);
      if (alignedSize > device.limits.maxBufferSize) {
        throw new RangeError(
          `${label} requires ${alignedSize} bytes, exceeding maxBufferSize`,
        );
      }
      const buffer = device.createBuffer({ label, size: alignedSize, usage });
      ownedBuffers.push(buffer);
      return buffer;
    };
    const createUniform = (label: string, values: Uint32Array): GPUBuffer => {
      const buffer = createBuffer(
        label,
        Math.max(16, values.byteLength),
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      );
      device.queue.writeBuffer(
        buffer,
        0,
        values.buffer as ArrayBuffer,
        values.byteOffset,
        values.byteLength,
      );
      return buffer;
    };

    const frameUniforms = createBuffer(
      "3dgs.frame-uniforms",
      FRAME_UNIFORM_BYTES,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    const projectedMean = createBuffer(
      "3dgs.projected-mean",
      this.gaussianData.count * PROJECTED_COMPONENT_BYTES,
    );
    const projectedConic = createBuffer(
      "3dgs.projected-conic",
      this.gaussianData.count * PROJECTED_COMPONENT_BYTES,
    );
    const projectedColor = createBuffer(
      "3dgs.projected-color",
      this.gaussianData.count * PROJECTED_COMPONENT_BYTES,
    );
    const tileCounts = createBuffer(
      "3dgs.tile-counts",
      this.gaussianData.count * UINT_BYTES,
    );
    const intersectionOffsets = createBuffer(
      "3dgs.intersection-offsets",
      this.gaussianData.count * UINT_BYTES,
    );
    const dispatch = createBuffer(
      "3dgs.indirect-dispatch",
      DISPATCH_BYTES,
      GPUBufferUsage.STORAGE |
        GPUBufferUsage.INDIRECT |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.UNIFORM,
    );

    const projectPipeline = device.createComputePipeline({
      label: "3dgs.project",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.project.wgsl",
          code: projectShader,
        }),
      },
    });
    const projectBindGroup = device.createBindGroup({
      label: "3dgs.project-bindings",
      layout: projectPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: storage(
            this.gaussianData.means,
            this.gaussianData.count * 16,
          ),
        },
        {
          binding: 1,
          resource: storage(
            this.gaussianData.scalesOpacity,
            this.gaussianData.count * 16,
          ),
        },
        {
          binding: 2,
          resource: storage(
            this.gaussianData.rotations,
            this.gaussianData.count * 16,
          ),
        },
        {
          binding: 3,
          resource: storage(
            this.gaussianData.shCoefficients,
            this.gaussianData.count * this.gaussianData.shCoefficientCount * 16,
          ),
        },
        { binding: 4, resource: storage(projectedMean) },
        { binding: 5, resource: storage(projectedConic) },
        { binding: 6, resource: storage(projectedColor) },
        { binding: 7, resource: storage(tileCounts) },
        { binding: 8, resource: { buffer: frameUniforms } },
      ],
    });

    const scanPipeline = device.createComputePipeline({
      label: "3dgs.scan-blocks",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.scan-blocks.wgsl",
          code: scanBlocksShader,
        }),
      },
    });
    const addScanOffsetsPipeline = device.createComputePipeline({
      label: "3dgs.add-scan-offsets",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.add-scan-offsets.wgsl",
          code: addScanOffsetsShader,
        }),
      },
    });
    const scanLevels: ScanLevel[] = [];
    let scanInput = tileCounts;
    let scanOutput = intersectionOffsets;
    let scanLength = this.gaussianData.count;
    while (true) {
      const blockCount = Math.ceil(scanLength / SCAN_BLOCK_ITEMS);
      const blockSums = createBuffer(
        `3dgs.scan-sums-${scanLevels.length}`,
        blockCount * UINT_BYTES,
      );
      const params = createUniform(
        `3dgs.scan-params-${scanLevels.length}`,
        new Uint32Array([scanLength]),
      );
      const scanBindGroup = device.createBindGroup({
        label: `3dgs.scan-bindings-${scanLevels.length}`,
        layout: scanPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: storage(scanInput) },
          { binding: 1, resource: storage(scanOutput) },
          { binding: 2, resource: storage(blockSums) },
          { binding: 3, resource: { buffer: params } },
        ],
      });
      scanLevels.push({
        length: scanLength,
        blockCount,
        output: scanOutput,
        blockSums,
        scanBindGroup,
      });
      if (blockCount <= 1) break;
      scanInput = blockSums;
      scanLength = blockCount;
      scanOutput = createBuffer(
        `3dgs.scan-offsets-${scanLevels.length}`,
        scanLength * UINT_BYTES,
      );
    }
    for (let level = 0; level < scanLevels.length - 1; level++) {
      const current = scanLevels[level]!;
      const parent = scanLevels[level + 1]!;
      const params = createUniform(
        `3dgs.scan-add-params-${level}`,
        new Uint32Array([current.length]),
      );
      current.addBindGroup = device.createBindGroup({
        label: `3dgs.scan-add-bindings-${level}`,
        layout: addScanOffsetsPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: storage(current.output) },
          { binding: 1, resource: storage(parent.output) },
          { binding: 2, resource: { buffer: params } },
        ],
      });
    }

    const prepareParams = createUniform(
      "3dgs.prepare-dispatch-params",
      new Uint32Array([this.gaussianData.count, this.intersectionCapacity]),
    );
    const prepareDispatchPipeline = device.createComputePipeline({
      label: "3dgs.prepare-dispatch",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.prepare-dispatch.wgsl",
          code: prepareDispatchShader,
        }),
      },
    });
    const prepareDispatchBindGroup = device.createBindGroup({
      label: "3dgs.prepare-dispatch-bindings",
      layout: prepareDispatchPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(tileCounts) },
        { binding: 1, resource: storage(intersectionOffsets) },
        { binding: 2, resource: storage(dispatch) },
        { binding: 3, resource: { buffer: prepareParams } },
      ],
    });

    const intersections = this.createIntersectionBuffers(createBuffer);
    const emitPipeline = device.createComputePipeline({
      label: `3dgs.emit-${this.depthSortMode}`,
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: `3dgs.emit-${this.depthSortMode}.wgsl`,
          code: emitIntersectionsShader(this.depthSortMode),
        }),
      },
    });
    const emitEntries: GPUBindGroupEntry[] = [
      { binding: 0, resource: storage(projectedMean) },
      { binding: 1, resource: storage(projectedConic) },
      { binding: 2, resource: storage(tileCounts) },
      { binding: 3, resource: storage(intersectionOffsets) },
    ];
    if (intersections.kind === "float32") {
      emitEntries.push(
        { binding: 4, resource: storage(intersections.tileA) },
        { binding: 5, resource: storage(intersections.depthA) },
        { binding: 6, resource: storage(intersections.gaussianA) },
        { binding: 7, resource: dispatchState(dispatch) },
        { binding: 8, resource: { buffer: frameUniforms } },
      );
    } else {
      emitEntries.push(
        { binding: 4, resource: storage(intersections.keyA) },
        { binding: 5, resource: storage(intersections.gaussianA) },
        { binding: 6, resource: dispatchState(dispatch) },
        { binding: 7, resource: { buffer: frameUniforms } },
      );
    }
    const emitBindGroup = device.createBindGroup({
      label: `3dgs.emit-${this.depthSortMode}-bindings`,
      layout: emitPipeline.getBindGroupLayout(0),
      entries: emitEntries,
    });

    const maxRadixBlocks = Math.ceil(
      this.intersectionCapacity / RADIX_BLOCK_ITEMS,
    );
    const histogramBytes = maxRadixBlocks * RADIX_SIZE * UINT_BYTES;
    const blockHistograms = createBuffer(
      "3dgs.radix-histograms",
      histogramBytes,
    );
    const blockPrefixes = createBuffer("3dgs.radix-prefixes", histogramBytes);
    const digitTotals = createBuffer(
      "3dgs.radix-digit-totals",
      RADIX_SIZE * UINT_BYTES,
    );
    const digitOffsets = createBuffer(
      "3dgs.radix-digit-offsets",
      RADIX_SIZE * UINT_BYTES,
    );
    const scanBlockHistogramsPipeline = device.createComputePipeline({
      label: "3dgs.radix-scan-blocks",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.radix-scan-blocks.wgsl",
          code: scanBlockHistogramsShader,
        }),
      },
    });
    const scanBlockHistogramsBindGroup = device.createBindGroup({
      label: "3dgs.radix-scan-blocks-bindings",
      layout: scanBlockHistogramsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(blockHistograms) },
        { binding: 1, resource: storage(blockPrefixes) },
        { binding: 2, resource: storage(digitTotals) },
        { binding: 3, resource: dispatchState(dispatch) },
      ],
    });
    const scanDigitTotalsPipeline = device.createComputePipeline({
      label: "3dgs.radix-scan-digits",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.radix-scan-digits.wgsl",
          code: scanDigitTotalsShader,
        }),
      },
    });
    const scanDigitTotalsBindGroup = device.createBindGroup({
      label: "3dgs.radix-scan-digits-bindings",
      layout: scanDigitTotalsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(digitTotals) },
        { binding: 1, resource: storage(digitOffsets) },
      ],
    });

    return {
      device,
      ownedBuffers,
      frameUniforms,
      projectedMean,
      projectedConic,
      projectedColor,
      tileCounts,
      intersectionOffsets,
      dispatch,
      projectPipeline,
      projectBindGroup,
      scanPipeline,
      addScanOffsetsPipeline,
      scanLevels,
      prepareDispatchPipeline,
      prepareDispatchBindGroup,
      emitPipeline,
      emitBindGroup,
      intersections,
      blockHistograms,
      blockPrefixes,
      digitOffsets,
      scanBlockHistogramsPipeline,
      scanBlockHistogramsBindGroup,
      scanDigitTotalsPipeline,
      scanDigitTotalsBindGroup,
      histogramModule: device.createShaderModule({
        label: `3dgs.radix-histogram-${this.depthSortMode}.wgsl`,
        code: radixHistogramShader(this.depthSortMode),
      }),
      scatterModule: device.createShaderModule({
        label: `3dgs.radix-scatter-${this.depthSortMode}.wgsl`,
        code: radixScatterShader(this.depthSortMode),
      }),
    };
  }

  private createIntersectionBuffers(
    createBuffer: (
      label: string,
      size: number,
      usage?: GPUBufferUsageFlags,
    ) => GPUBuffer,
  ): IntersectionBuffers {
    const bytes = this.intersectionCapacity * UINT_BYTES;
    if (this.depthSortMode === "float32") {
      return {
        kind: "float32",
        tileA: createBuffer("3dgs.tile-a", bytes),
        depthA: createBuffer("3dgs.depth-a", bytes),
        gaussianA: createBuffer("3dgs.gaussian-a", bytes),
        tileB: createBuffer("3dgs.tile-b", bytes),
        depthB: createBuffer("3dgs.depth-b", bytes),
        gaussianB: createBuffer("3dgs.gaussian-b", bytes),
      };
    }
    return {
      kind: "packed16",
      keyA: createBuffer("3dgs.packed-key-a", bytes),
      gaussianA: createBuffer("3dgs.gaussian-a", bytes),
      keyB: createBuffer("3dgs.packed-key-b", bytes),
      gaussianB: createBuffer("3dgs.gaussian-b", bytes),
    };
  }

  private createTileResources(
    renderer: WebGPURenderer,
    backend: WebGPUBackendAccess,
    width: number,
    height: number,
  ): TileResources {
    const core = this.core!;
    const device = core.device;
    const ownedBuffers: GPUBuffer[] = [];
    const createBuffer = (
      label: string,
      size: number,
      usage = GPUBufferUsage.STORAGE,
    ): GPUBuffer => {
      const buffer = device.createBuffer({ label, size: align4(size), usage });
      ownedBuffers.push(buffer);
      return buffer;
    };
    const createUniform = (label: string, values: Uint32Array): GPUBuffer => {
      const buffer = createBuffer(
        label,
        16,
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      );
      device.queue.writeBuffer(
        buffer,
        0,
        values.buffer as ArrayBuffer,
        values.byteOffset,
        values.byteLength,
      );
      return buffer;
    };

    const tilesX = Math.ceil(width / TILE_SIZE);
    const tilesY = Math.ceil(height / TILE_SIZE);
    const tileCount = tilesX * tilesY;
    if (
      tilesX > device.limits.maxComputeWorkgroupsPerDimension ||
      tilesY > device.limits.maxComputeWorkgroupsPerDimension
    ) {
      throw new RangeError(
        "Render size exceeds the device's tile dispatch limit",
      );
    }
    if (this.depthSortMode === "packed16" && tileCount > 65_535) {
      throw new RangeError(
        `packed16 supports at most 65,535 tiles; ${width}x${height} creates ${tileCount}. Use depthSortMode: 'float32'.`,
      );
    }

    const tileBits = Math.max(1, Math.ceil(Math.log2(Math.max(1, tileCount))));
    const tilePasses = Math.ceil(tileBits / RADIX_BITS);
    const radixPasses = this.createRadixPasses(core, tilePasses);
    const finalInputA = radixPasses.length % 2 === 0;
    const sortedKey =
      core.intersections.kind === "float32"
        ? finalInputA
          ? core.intersections.tileA
          : core.intersections.tileB
        : finalInputA
          ? core.intersections.keyA
          : core.intersections.keyB;
    const sortedGaussianIds =
      core.intersections.kind === "float32"
        ? finalInputA
          ? core.intersections.gaussianA
          : core.intersections.gaussianB
        : finalInputA
          ? core.intersections.gaussianA
          : core.intersections.gaussianB;

    const tileOffsets = createBuffer(
      "3dgs.tile-offsets",
      (tileCount + 1) * UINT_BYTES,
    );
    const offsetParams = createUniform(
      "3dgs.tile-offset-params",
      new Uint32Array([tileCount + 1]),
    );
    const shaders = tileOffsetShaders(this.depthSortMode);
    const clearOffsetsPipeline = device.createComputePipeline({
      label: "3dgs.clear-tile-offsets",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.clear-tile-offsets.wgsl",
          code: shaders.clear,
        }),
      },
    });
    const clearOffsetsBindGroup = device.createBindGroup({
      label: "3dgs.clear-tile-offsets-bindings",
      layout: clearOffsetsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(tileOffsets) },
        { binding: 1, resource: { buffer: offsetParams } },
      ],
    });
    const findBoundariesPipeline = device.createComputePipeline({
      label: "3dgs.find-tile-boundaries",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.find-tile-boundaries.wgsl",
          code: shaders.boundaries,
        }),
      },
    });
    const findBoundariesBindGroup = device.createBindGroup({
      label: "3dgs.find-tile-boundaries-bindings",
      layout: findBoundariesPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(sortedKey) },
        { binding: 1, resource: storage(tileOffsets) },
        { binding: 2, resource: dispatchState(core.dispatch) },
      ],
    });
    const fillOffsetsPipeline = device.createComputePipeline({
      label: "3dgs.fill-tile-offset-gaps",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.fill-tile-offset-gaps.wgsl",
          code: shaders.fill,
        }),
      },
    });
    const fillOffsetsBindGroup = device.createBindGroup({
      label: "3dgs.fill-tile-offset-gaps-bindings",
      layout: fillOffsetsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(tileOffsets) },
        { binding: 1, resource: dispatchState(core.dispatch) },
        { binding: 2, resource: { buffer: offsetParams } },
      ],
    });

    const outputTexture = backend.get(this.renderTarget.texture).texture;
    if (outputTexture === undefined) {
      throw new Error(
        "Three.js did not initialize the GaussianPass output texture",
      );
    }
    const rasterizePipeline = device.createComputePipeline({
      label: "3dgs.rasterize",
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "3dgs.rasterize.wgsl",
          code: rasterizeShader,
        }),
      },
    });
    const rasterizeBindGroup = device.createBindGroup({
      label: "3dgs.rasterize-bindings",
      layout: rasterizePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: storage(core.projectedMean) },
        { binding: 1, resource: storage(core.projectedConic) },
        { binding: 2, resource: storage(core.projectedColor) },
        { binding: 3, resource: storage(sortedGaussianIds) },
        { binding: 4, resource: storage(tileOffsets) },
        { binding: 5, resource: outputTexture.createView() },
        { binding: 6, resource: { buffer: core.frameUniforms } },
      ],
    });

    // renderer is intentionally accepted here: keeping creation tied to the
    // initialized render target makes the Three.js/GPTexture ownership boundary explicit.
    void renderer;
    return {
      width,
      height,
      tilesX,
      tilesY,
      tileCount,
      ownedBuffers,
      radixPasses,
      sortedKey,
      sortedGaussianIds,
      tileOffsets,
      clearOffsetsPipeline,
      clearOffsetsBindGroup,
      findBoundariesPipeline,
      findBoundariesBindGroup,
      fillOffsetsPipeline,
      fillOffsetsBindGroup,
      rasterizePipeline,
      rasterizeBindGroup,
    };
  }

  private createRadixPasses(
    core: CoreResources,
    tilePassCount: number,
  ): RadixPassResources[] {
    const device = core.device;
    const descriptors: Array<{ shift: number; keyKind: number }> = [];
    if (this.depthSortMode === "float32") {
      for (let shift = 0; shift < 32; shift += RADIX_BITS)
        descriptors.push({ shift, keyKind: 0 });
      for (let pass = 0; pass < tilePassCount; pass++) {
        descriptors.push({ shift: pass * RADIX_BITS, keyKind: 1 });
      }
    } else {
      for (let shift = 0; shift < 32; shift += RADIX_BITS)
        descriptors.push({ shift, keyKind: 0 });
    }

    return descriptors.map(({ shift, keyKind }, passIndex) => {
      const inputA = passIndex % 2 === 0;
      const histogramPipeline = device.createComputePipeline({
        label: `3dgs.radix-histogram-${passIndex}`,
        layout: "auto",
        compute: {
          module: core.histogramModule,
          constants: { SHIFT: shift, KEY_KIND: keyKind },
        },
      });
      const scatterPipeline = device.createComputePipeline({
        label: `3dgs.radix-scatter-${passIndex}`,
        layout: "auto",
        compute: {
          module: core.scatterModule,
          constants: { SHIFT: shift, KEY_KIND: keyKind },
        },
      });
      let histogramEntries: GPUBindGroupEntry[];
      let scatterEntries: GPUBindGroupEntry[];
      if (core.intersections.kind === "float32") {
        const inputTile = inputA
          ? core.intersections.tileA
          : core.intersections.tileB;
        const inputDepth = inputA
          ? core.intersections.depthA
          : core.intersections.depthB;
        const inputGaussian = inputA
          ? core.intersections.gaussianA
          : core.intersections.gaussianB;
        const outputTile = inputA
          ? core.intersections.tileB
          : core.intersections.tileA;
        const outputDepth = inputA
          ? core.intersections.depthB
          : core.intersections.depthA;
        const outputGaussian = inputA
          ? core.intersections.gaussianB
          : core.intersections.gaussianA;
        histogramEntries = [
          { binding: 0, resource: storage(inputTile) },
          { binding: 1, resource: storage(inputDepth) },
          { binding: 2, resource: storage(core.blockHistograms) },
          { binding: 3, resource: dispatchState(core.dispatch) },
        ];
        scatterEntries = [
          { binding: 0, resource: storage(inputTile) },
          { binding: 1, resource: storage(inputDepth) },
          { binding: 2, resource: storage(inputGaussian) },
          { binding: 3, resource: storage(core.blockPrefixes) },
          { binding: 4, resource: storage(core.digitOffsets) },
          { binding: 5, resource: storage(outputTile) },
          { binding: 6, resource: storage(outputDepth) },
          { binding: 7, resource: storage(outputGaussian) },
          { binding: 8, resource: dispatchState(core.dispatch) },
        ];
      } else {
        const inputKey = inputA
          ? core.intersections.keyA
          : core.intersections.keyB;
        const inputGaussian = inputA
          ? core.intersections.gaussianA
          : core.intersections.gaussianB;
        const outputKey = inputA
          ? core.intersections.keyB
          : core.intersections.keyA;
        const outputGaussian = inputA
          ? core.intersections.gaussianB
          : core.intersections.gaussianA;
        histogramEntries = [
          { binding: 0, resource: storage(inputKey) },
          { binding: 1, resource: storage(core.blockHistograms) },
          { binding: 2, resource: dispatchState(core.dispatch) },
        ];
        scatterEntries = [
          { binding: 0, resource: storage(inputKey) },
          { binding: 1, resource: storage(inputGaussian) },
          { binding: 2, resource: storage(core.blockPrefixes) },
          { binding: 3, resource: storage(core.digitOffsets) },
          { binding: 4, resource: storage(outputKey) },
          { binding: 5, resource: storage(outputGaussian) },
          { binding: 6, resource: dispatchState(core.dispatch) },
        ];
      }
      return {
        histogramPipeline,
        histogramBindGroup: device.createBindGroup({
          label: `3dgs.radix-histogram-bindings-${passIndex}`,
          layout: histogramPipeline.getBindGroupLayout(0),
          entries: histogramEntries,
        }),
        scatterPipeline,
        scatterBindGroup: device.createBindGroup({
          label: `3dgs.radix-scatter-bindings-${passIndex}`,
          layout: scatterPipeline.getBindGroupLayout(0),
          entries: scatterEntries,
        }),
      };
    });
  }

  private updateFrameUniforms(
    queue: GPUQueue,
    width: number,
    height: number,
    tilesX: number,
    tilesY: number,
  ): void {
    const camera = this.camera as PerspectiveCamera;
    this.anchor.updateWorldMatrix(true, false);
    camera.updateWorldMatrix(true, false);
    _modelView.multiplyMatrices(
      camera.matrixWorldInverse,
      this.anchor.matrixWorld,
    );
    _inverseModel.copy(this.anchor.matrixWorld).invert();
    _cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    _cameraLocalPosition.copy(_cameraWorldPosition).applyMatrix4(_inverseModel);

    const bytes = new ArrayBuffer(FRAME_UNIFORM_BYTES);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    _modelView.toArray(floats, 0);
    camera.projectionMatrix.toArray(floats, 16);
    floats.set(
      [
        _cameraLocalPosition.x,
        _cameraLocalPosition.y,
        _cameraLocalPosition.z,
        1,
      ],
      32,
    );
    floats.set([width, height, camera.near, camera.far], 36);
    uints.set(
      [tilesX, tilesY, this.gaussianData.count, this.gaussianData.shDegree],
      40,
    );
    floats.set(this.background, 44);
    queue.writeBuffer(this.core!.frameUniforms, 0, bytes);
  }

  private encodeFrame(core: CoreResources, tiles: TileResources): void {
    const encoder = core.device.createCommandEncoder({ label: "3dgs.frame" });
    const pass = encoder.beginComputePass({ label: "3dgs.tiled-render" });

    pass.setPipeline(core.projectPipeline);
    pass.setBindGroup(0, core.projectBindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.gaussianData.count / WORKGROUP_SIZE),
    );

    for (const level of core.scanLevels) {
      pass.setPipeline(core.scanPipeline);
      pass.setBindGroup(0, level.scanBindGroup);
      pass.dispatchWorkgroups(level.blockCount);
    }
    for (let level = core.scanLevels.length - 2; level >= 0; level--) {
      const current = core.scanLevels[level]!;
      pass.setPipeline(core.addScanOffsetsPipeline);
      pass.setBindGroup(0, current.addBindGroup!);
      pass.dispatchWorkgroups(Math.ceil(current.length / WORKGROUP_SIZE));
    }

    pass.setPipeline(core.prepareDispatchPipeline);
    pass.setBindGroup(0, core.prepareDispatchBindGroup);
    pass.dispatchWorkgroups(1);

    pass.setPipeline(core.emitPipeline);
    pass.setBindGroup(0, core.emitBindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.gaussianData.count / WORKGROUP_SIZE),
    );

    for (const radix of tiles.radixPasses) {
      pass.setPipeline(radix.histogramPipeline);
      pass.setBindGroup(0, radix.histogramBindGroup);
      pass.dispatchWorkgroupsIndirect(core.dispatch, RADIX_DISPATCH_OFFSET);
      pass.setPipeline(core.scanBlockHistogramsPipeline);
      pass.setBindGroup(0, core.scanBlockHistogramsBindGroup);
      pass.dispatchWorkgroups(1);
      pass.setPipeline(core.scanDigitTotalsPipeline);
      pass.setBindGroup(0, core.scanDigitTotalsBindGroup);
      pass.dispatchWorkgroups(1);
      pass.setPipeline(radix.scatterPipeline);
      pass.setBindGroup(0, radix.scatterBindGroup);
      pass.dispatchWorkgroupsIndirect(core.dispatch, RADIX_DISPATCH_OFFSET);
    }

    pass.setPipeline(tiles.clearOffsetsPipeline);
    pass.setBindGroup(0, tiles.clearOffsetsBindGroup);
    pass.dispatchWorkgroups(Math.ceil((tiles.tileCount + 1) / WORKGROUP_SIZE));
    pass.setPipeline(tiles.findBoundariesPipeline);
    pass.setBindGroup(0, tiles.findBoundariesBindGroup);
    pass.dispatchWorkgroupsIndirect(core.dispatch, LINEAR_DISPATCH_OFFSET);
    pass.setPipeline(tiles.fillOffsetsPipeline);
    pass.setBindGroup(0, tiles.fillOffsetsBindGroup);
    pass.dispatchWorkgroups(1);
    pass.setPipeline(tiles.rasterizePipeline);
    pass.setBindGroup(0, tiles.rasterizeBindGroup);
    pass.dispatchWorkgroups(tiles.tilesX, tiles.tilesY);

    pass.end();
    core.device.queue.submit([encoder.finish()]);
  }

  private destroyTileResources(): void {
    if (this.tiles === null) return;
    for (const buffer of this.tiles.ownedBuffers) buffer.destroy();
    this.tiles = null;
  }

  override dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.destroyTileResources();
    if (this.core !== null) {
      for (const buffer of this.core.ownedBuffers) buffer.destroy();
      this.core = null;
    }
    super.dispose();
  }
}

/** Convenience factory matching Three.js pass(), bloom(), and other TSL pass helpers. */
export function gaussianPass(
  renderer: WebGPURenderer,
  camera: PerspectiveCamera,
  gaussianData: GaussianData,
  anchor: Object3D,
  options?: GaussianPassOptions,
): GaussianPass {
  return new GaussianPass(renderer, camera, gaussianData, anchor, options);
}
