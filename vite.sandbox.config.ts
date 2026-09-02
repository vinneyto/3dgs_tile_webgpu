import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  root: "sandbox",
  build: {
    outDir: "../sandbox-dist",
    emptyOutDir: true,
  },
});
