import { useEffect, useRef, useState } from "react"
import type { Filter, LSelection, State } from "~/types"
import { filterFnRegistry } from "~/utils/filters/registry"
import ProcessWorker from "~/worker/processCanvas.worker.ts?worker"
type WorkerResult = {
  updatedSelection: LSelection<Filter>
  processedImageData: ImageData
  layerIndex: number
}

const useProcessCanvas = () => {
  const [processed, setProcessed] = useState<number>(1)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new ProcessWorker()
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const process = async (state: State, processingAs: State["processingAs"], refreshIdx = -1): Promise<State["layers"]> => {
    if (!state.imgCtx || !workerRef.current) {
      throw new Error("cannot process canvas")
    }

    let refreshNext = false

    // when generating a gif it should refresh all layer to get different results
    if (refreshIdx === -1) {
      refreshNext = true
    }

    const imageCanvas = state.imgCtx
    if (!imageCanvas || !state.originalImageData) throw new Error()
    // reset image to the original state
    imageCanvas.putImageData(state.originalImageData, 0, 0)
    let currentImageData = imageCanvas.getImageData(0, 0, imageCanvas.canvas.width, imageCanvas.canvas.height)

    const nextLayers = [...state.layers]

    setProcessed(1)

    for (let i = 0; i < nextLayers.length; i++) {
      const layer = nextLayers[i]
      const { filter, selectionArea } = layer.selection

      if (!selectionArea) {
        console.log("No selection area")
        continue
      }
      if (!filterFnRegistry[filter]) {
        console.error(`could not find filter ${filter}`)
        continue
      }

      const { ctx: _, ...layerWithoutCtx } = layer

      // should reprocess next layers after i to update the results after
      if (refreshIdx === i) {
        refreshNext = true
      }

      const result = await new Promise<WorkerResult>((resolve, reject) => {
        if (!workerRef.current) {
          reject("workerRef is undefined")
          return
        }
        const handleMsg = (e: MessageEvent<WorkerResult>) => {
          workerRef.current?.removeEventListener("message", handleMsg)
          // generate image directly after we get the result
          imageCanvas.putImageData(e.data.processedImageData, 0, 0)
          resolve(e.data)
        }
        workerRef.current.addEventListener("message", handleMsg)
        workerRef.current.postMessage({
          layer: layerWithoutCtx,
          filter,
          imageData: structuredClone(currentImageData),
          selectionArea,
          layerIndex: i,
          refresh: refreshNext || refreshIdx === i,
          variative: processingAs === "gif"
        })
      })

      currentImageData = result.processedImageData
      setProcessed((prev) => prev + 1)

      nextLayers[i] = {
        ...layer,
        selection: result.updatedSelection
      }
    }

    return nextLayers
  }

  return { process, processed }
}

export default useProcessCanvas
