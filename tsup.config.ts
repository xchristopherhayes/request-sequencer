import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  splitting: true,
  clean: true,
  target: "esnext",
  format: ["cjs", "esm"],
  outDir: "dist",
  outExtension: ({ format }) =>
    format === "esm" ? { js: ".mjs" } : { js: ".cjs" },
  dts: true,
});
