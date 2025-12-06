import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    optimizeDeps: { exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"] },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp"
      }
    },
    plugins: [
      tsconfigPaths(),
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]]
        }
      })
    ],
    base: mode === "development" ? "/" : "/bendor/"
  }
})
