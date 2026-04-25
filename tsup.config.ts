import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  // tsup's `.d.ts` worker may use TS 6+, which allows `ignoreDeprecations: "6.0"`.
  // Keep it out of `tsconfig.json` so `tsc` 5.x (project typecheck) stays valid.
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: "es2020",
  minify: false,
  external: ["react"]
});
