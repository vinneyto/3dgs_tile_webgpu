import {
  Camera,
  Matrix4,
  Ray,
  Raycaster,
  Vector2,
  Vector3,
  type Node,
} from "three/webgpu";
import { float, length, time, uniform, vec3 } from "three/tsl";

import type { GaussianCloud } from "./GaussianCloud";
import { gaussianPositionLocal } from "./nodes/GaussianContextNodes";

export interface GaussianRippleNodeOptions {
  cloud: GaussianCloud;
  camera: Camera;
  domElement: HTMLElement;
  /** Owns the click listener lifetime. */
  signal: AbortSignal;
  /** Optional runtime multiplier, useful for an enable/disable uniform. */
  strengthNode?: Node<"float">;
  /** Peak local-space displacement. Defaults to 0.05 (5 cm when units are meters). */
  amplitude?: number;
  /** Distance between carrier rings. Defaults to 0.05 (5 cm when units are meters). */
  wavelength?: number;
  /** Local-space propagation speed per second. Defaults to 0.25. */
  speed?: number;
  /** Width of the moving wave packet. Defaults to 2.5 wavelengths. */
  packetWidth?: number;
  /** Vertical Gaussian falloff width. Defaults to 2 wavelengths. */
  verticalWidth?: number;
  /** Exponential decay per second. Defaults to 0.7. */
  decay?: number;
  /** Gaussian hit radius in standard deviations. Defaults to 3. */
  raycastRadiusScale?: number;
}

/**
 * Returns a local-position node and installs a click controller that emits a
 * damped transverse concentric ripple from the nearest full-source octree hit.
 */
export function createGaussianRippleNode(
  options: GaussianRippleNodeOptions,
): Node<"vec3"> {
  const lod = options.cloud.lod;
  if (lod === null) {
    throw new Error(
      "Gaussian ripple raycasting requires an octree-backed cloud",
    );
  }

  const amplitude = positive(options.amplitude ?? 0.05, "amplitude");
  const wavelength = positive(options.wavelength ?? 0.05, "wavelength");
  const speed = positive(options.speed ?? 0.25, "speed");
  const packetWidth = positive(
    options.packetWidth ?? wavelength * 2.5,
    "packetWidth",
  );
  const verticalWidth = positive(
    options.verticalWidth ?? wavelength * 2,
    "verticalWidth",
  );
  const decay = nonNegative(options.decay ?? 0.7, "decay");
  const raycastRadiusScale = positive(
    options.raycastRadiusScale ?? 3,
    "raycastRadiusScale",
  );

  const centerNode = uniform(new Vector3()).setName("gaussianRippleCenter");
  const startTimeNode = uniform(-1_000_000).setName("gaussianRippleStartTime");
  const elapsed = time.sub(startTimeNode).max(0);
  const radius = length(gaussianPositionLocal.xz.sub(centerNode.xz));
  const signedDistance = radius.sub(elapsed.mul(speed));
  const envelope = signedDistance
    .div(packetWidth)
    .pow2()
    .negate()
    .exp()
    .mul(elapsed.mul(-decay).exp());
  const verticalEnvelope = gaussianPositionLocal.y
    .sub(centerNode.y)
    .div(verticalWidth)
    .pow2()
    .negate()
    .exp();
  const carrier = signedDistance
    .mul((Math.PI * 2) / wavelength)
    .add(Math.PI * 0.5)
    .sin();
  const displacement = carrier
    .mul(envelope)
    .mul(verticalEnvelope)
    .mul(amplitude)
    .mul(options.strengthNode ?? float(1));

  const pointer = new Vector2();
  const raycaster = new Raycaster();
  const inverseWorld = new Matrix4();
  const localRay = new Ray();
  options.domElement.addEventListener(
    "click",
    (event) => {
      if (event.button !== 0) return;
      const bounds = options.domElement.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, options.camera);
      options.cloud.updateWorldMatrix(true, false);
      inverseWorld.copy(options.cloud.matrixWorld).invert();
      localRay.copy(raycaster.ray).applyMatrix4(inverseWorld);
      const hit = lod.octree.raycast(localRay, {
        radiusScale: raycastRadiusScale,
        maxHits: 1,
      })[0];
      if (hit === undefined) return;
      centerNode.value.copy(hit.point);
      startTimeNode.value = time.value;
    },
    { signal: options.signal },
  );

  return gaussianPositionLocal.add(vec3(0, displacement, 0));
}

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Gaussian ripple ${name} must be positive`);
  }
  return value;
}

function nonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Gaussian ripple ${name} must be non-negative`);
  }
  return value;
}
