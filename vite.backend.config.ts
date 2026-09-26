import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/backend-entry.ts",
      formats: ["es"],
      fileName: "backend",
    },
    rollupOptions: {
      external: ["three", "three/webgpu"],
    },
    sourcemap: false,
  },
});
