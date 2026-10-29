import { defineConfig } from "vite";
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: { entry: "src/spark-entry.ts", formats: ["es"], fileName: "spark" },
    rollupOptions: { external: ["three", "three/webgpu", "three/tsl"] },
    sourcemap: false,
  },
});
