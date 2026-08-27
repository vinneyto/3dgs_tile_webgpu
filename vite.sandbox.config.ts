import { defineConfig } from "vite";

export default defineConfig({
  root: "sandbox",
  build: {
    outDir: "../sandbox-dist",
    emptyOutDir: true,
  },
});
