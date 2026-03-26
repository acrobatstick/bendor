import { type ReactNode, useState } from "react"
import { CanvasLoadingContext } from "./context"

export const CanvasLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false)
  const start = () => setLoading(true)
  const stop = () => setLoading(false)
  return <CanvasLoadingContext value={{ loading, start, stop }}>{children}</CanvasLoadingContext>
}
