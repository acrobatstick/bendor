import { useContext } from "react"
import { CanvasLoadingContext } from "~/providers/canvasloading/context"

export const useCanvasLoading = () => useContext(CanvasLoadingContext)
