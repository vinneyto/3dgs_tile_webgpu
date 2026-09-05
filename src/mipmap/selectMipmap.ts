export interface MipmapSelectionTree {
  left: Int32Array;
  right: Int32Array;
  counts: Uint32Array;
  spheres: Float32Array;
}
export interface MipmapView {
  matrix: number[];
  projection: number[];
  width: number;
  height: number;
  pixelSize: number;
  perspective: boolean;
}
export interface MipmapSelection {
  nodeIds: Uint32Array;
  gaussianCount: number;
}

/** Largest projected groups refine first, subject to a hard Gaussian budget. */
export function selectMipmap(
  tree: MipmapSelectionTree,
  view: MipmapView,
  budget: number,
): MipmapSelection {
  const selected = new Set<number>();
  const heap: { id: number; error: number }[] = [];
  const m = view.matrix,
    p = view.projection;
  const scale = Math.max(
    Math.hypot(m[0]!, m[1]!, m[2]!),
    Math.hypot(m[4]!, m[5]!, m[6]!),
    Math.hypot(m[8]!, m[9]!, m[10]!),
  );
  const focal =
    Math.max(Math.abs(p[0]!) * view.width, Math.abs(p[5]!) * view.height) * 0.5;
  function error(id: number): number {
    const o = id * 4,
      s = tree.spheres;
    const x = s[o]!,
      y = s[o + 1]!,
      z = s[o + 2]!;
    const vx = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
    const vy = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
    const vz = m[2]! * x + m[6]! * y + m[10]! * z + m[14]!;
    const radius = s[o + 3]! * scale;
    // Angular size uses radial distance, keeping the cut stable on camera rotation.
    // Do not omit off-screen subtrees: an asynchronous cut must remain complete
    // when the camera turns before its worker result arrives. GPU projection culls them.
    return (
      (2 * radius * focal) /
      (view.perspective ? Math.max(1e-6, Math.hypot(vx, vy, vz) - radius) : 1)
    );
  }
  function push(id: number, e: number): void {
    if (tree.left[id]! < 0 || e <= view.pixelSize) return;
    const value = { id, error: e };
    let i = heap.length;
    heap.push(value);
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (heap[parent]!.error >= e) break;
      heap[i] = heap[parent]!;
      i = parent;
    }
    heap[i] = value;
  }
  function pop() {
    const root = heap[0]!,
      tail = heap.pop()!;
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < heap.length &&
          heap[child + 1]!.error > heap[child]!.error
        )
          child++;
        if (heap[child]!.error <= tail.error) break;
        heap[i] = heap[child]!;
        i = child;
      }
      heap[i] = tail;
    }
    return root;
  }
  const rootError = error(0);
  if (budget < tree.counts[0]! || rootError < 0)
    return { nodeIds: new Uint32Array(), gaussianCount: 0 };
  let count = tree.counts[0]!;
  selected.add(0);
  push(0, rootError);
  while (heap.length) {
    const { id } = pop();
    const children = [tree.left[id]!, tree.right[id]!]
      .map((id) => ({ id, error: error(id) }))
      .filter((c) => c.error >= 0);
    const next =
      count -
      tree.counts[id]! +
      children.reduce((sum, c) => sum + tree.counts[c.id]!, 0);
    if (next > budget) continue;
    selected.delete(id);
    count = next;
    for (const child of children) {
      selected.add(child.id);
      push(child.id, child.error);
    }
  }
  return { nodeIds: Uint32Array.from(selected).sort(), gaussianCount: count };
}
