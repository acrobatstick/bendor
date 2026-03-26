import { createContext } from "react"

export const CanvasLoadingContext = createContext<{
  loading: boolean
  start: () => void
  stop: () => void
}>({
  loading: false,
  start: () => undefined,
  stop: () => undefined
})
