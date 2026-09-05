import {
  selectMipmap,
  type MipmapSelectionTree,
  type MipmapView,
} from "./selectMipmap";
let tree: MipmapSelectionTree;
self.onmessage = (
  event: MessageEvent<{
    tree?: MipmapSelectionTree;
    view: MipmapView;
    budget: number;
  }>,
) => {
  try {
    if (event.data.tree) {
      tree = event.data.tree;
      return;
    }
    const started = performance.now();
    const selection = selectMipmap(tree, event.data.view, event.data.budget);
    self.postMessage(
      { selection, planningMs: performance.now() - started },
      { transfer: [selection.nodeIds.buffer] },
    );
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
