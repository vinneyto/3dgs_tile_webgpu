import { createNodeStreamingServer } from "./index.mjs";

const port = Number(process.env.GAUSSIAN_BACKEND_PORT ?? 8765);
const server = await createNodeStreamingServer({ port });
console.log(`Gaussian backend listening on ${JSON.stringify(server.address())}`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => { void server.close().then(() => process.exit(0)); });
