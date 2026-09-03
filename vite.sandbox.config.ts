import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  root: "sandbox",
  resolve: {
    alias: {
      "3dgs-tile-webgpu": new URL("./src/index.ts", import.meta.url).pathname,
    },
  },
  build: {
    outDir: "../sandbox-dist",
    emptyOutDir: true,
  },
});
