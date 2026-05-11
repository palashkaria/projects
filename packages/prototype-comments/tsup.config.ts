import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "iife"],
  globalName: "PrototypeComments",
  platform: "browser",
  target: "es2022",
  dts: { resolve: true },
  tsconfig: "./tsconfig.build.json",
  clean: true,
  minify: false,
  noExternal: ["@medv/finder", "@floating-ui/dom"],
});
