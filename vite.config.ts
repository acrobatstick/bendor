import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
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
