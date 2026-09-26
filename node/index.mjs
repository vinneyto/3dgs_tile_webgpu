import net from "node:net";
import { StreamingGaussianBackend } from "3dgs-tile-webgpu/backend";
import { DEFAULT_MAX_FRAME_BYTES, encodeFrame, FrameReader } from "./codec.mjs";

/** One backend instance per TCP connection. The renderer and GPU are never loaded. */
export async function createNodeStreamingServer({
  host = "127.0.0.1", port = 0, maxFrameBytes = DEFAULT_MAX_FRAME_BYTES,
} = {}) {
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    const frames = new FrameReader(maxFrameBytes);
    let backend = null;
    const cleanup = () => {
      backend?.dispose();
      backend = null;
      sockets.delete(socket);
    };
    socket.on("close", cleanup);
    socket.on("error", () => socket.destroy());
    socket.on("data", (chunk) => {
      try {
        for (const message of frames.push(chunk)) {
          if (message.type === "initialize") {
            if (backend) throw new Error("Gaussian backend already initialized");
            backend = new StreamingGaussianBackend(message.config);
            backend.subscribe((event) => {
              if (!socket.destroyed) socket.write(encodeFrame({ type: "event", event }, maxFrameBytes));
            });
            socket.write(encodeFrame({ type: "ready" }, maxFrameBytes));
          } else if (message.type === "dispatch") {
            if (!backend) throw new Error("Gaussian backend is not initialized");
            backend.dispatch(message.command);
          } else if (message.type === "dispose") {
            socket.end();
          } else throw new Error(`Unknown Gaussian backend message: ${message.type}`);
        }
      } catch (error) {
        socket.destroy(error);
      }
    });
  });
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, () => { server.off("error", reject); resolve(); });
    });
  } catch (error) {
    server.close();
    throw error;
  }
  return {
    address() { return server.address(); },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}

/** Node client of the same dispatch/subscribe/dispose contract as the worker proxy. */
export class NodeStreamingGaussianBackend {
  #socket;
  #listeners = new Set();
  #queued = [];
  #ready = false;
  #closed = false;
  #disposed = false;
  #rejectReady;
  ready;

  constructor(config, { host = "127.0.0.1", port, maxFrameBytes = DEFAULT_MAX_FRAME_BYTES } = {}) {
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new RangeError("Node backend requires a TCP port");
    this.ready = new Promise((resolve, reject) => {
      this.#rejectReady = reject;
      const socket = net.createConnection({ host, port });
      this.#socket = socket;
      const frames = new FrameReader(maxFrameBytes);
      socket.on("connect", () => socket.write(encodeFrame({ type: "initialize", config }, maxFrameBytes)));
      socket.on("data", (chunk) => {
        try {
          for (const message of frames.push(chunk)) {
            if (message.type === "ready") {
              this.#ready = true;
              resolve();
              for (const frame of this.#queued) socket.write(frame);
              this.#queued.length = 0;
            } else if (message.type === "event") {
              for (const listener of this.#listeners) listener(message.event);
            } else throw new Error(`Unknown Gaussian backend message: ${message.type}`);
          }
        } catch (error) { socket.destroy(error); }
      });
      socket.on("error", (error) => {
        this.#closed = true;
        if (!this.#ready) reject(error);
        if (!this.#disposed)
          for (const listener of this.#listeners)
            listener({ type: "error", code: "node-transport-error", message: error.message });
      });
      socket.on("close", () => {
        if (!this.#ready) reject(new Error("Node backend connection closed before initialization"));
        if (!this.#disposed && !this.#closed)
          for (const listener of this.#listeners)
            listener({ type: "error", code: "node-transport-error", message: "Node backend connection closed" });
        this.#closed = true;
        this.#ready = false;
      });
    });
    this.ready.catch(() => {}); // Callers may use only the GaussianBackend interface.
    this.#maxFrameBytes = maxFrameBytes;
  }

  #maxFrameBytes;

  dispatch(command) {
    if (this.#disposed) throw new Error("Node backend disposed");
    if (this.#closed) throw new Error("Node backend connection closed");
    const frame = encodeFrame({ type: "dispatch", command }, this.#maxFrameBytes);
    if (this.#ready) this.#socket.write(frame);
    else this.#queued.push(frame);
  }

  subscribe(listener) {
    if (this.#disposed) throw new Error("Node backend disposed");
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#queued.length = 0;
    if (this.#ready) this.#socket.end(encodeFrame({ type: "dispose" }, this.#maxFrameBytes));
    else {
      this.#rejectReady(new Error("Node backend disposed before initialization"));
      this.#socket.destroy();
    }
    this.#listeners.clear();
  }
}

export class NodeStreamingGaussianBackendFactory {
  constructor(options) { this.options = options; }
  createBackend(config) { return new NodeStreamingGaussianBackend(config, this.options); }
}
