import { buildMipmap, type MipmapSource } from "./buildMipmap";
self.onmessage = (
  event: MessageEvent<{ source: MipmapSource; leafSize: number }>,
) => {
  try {
    const tree = buildMipmap(event.data.source, event.data.leafSize);
    self.postMessage(
      { tree },
      { transfer: Object.values(tree).map((array) => array.buffer) },
    );
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
