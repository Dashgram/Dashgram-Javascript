import typescript from "@rollup/plugin-typescript"
import { terser } from "rollup-plugin-terser"

export default {
  input: "src/umd.ts",
  output: {
    file: "dist/dashgram.min.js",
    format: "iife",
    name: "DashgramMini",
    sourcemap: true,
    extend: false
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false
    }),
    terser()
  ]
}
