import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.tsx'],
    minify: true,
    format: "esm",
    dts: true,
    sourcemap: true,
    treeshake: true,
    clean: true,
    external: ["react", "zod"]
})