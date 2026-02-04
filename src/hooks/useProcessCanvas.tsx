import { useEffect, useRef } from "react"
import type { Filter, LSelection, State } from "~/types"
import { filterFnRegistry } from "~/utils/filters/registry"
import ProcessWorker from "~/worker/processCanvas.worker.ts?worker"

type WorkerResult = {
  updatedSelection: LSelection<Filter>
  processedImageData: ImageData
  layerIndex: number
}

const useProcessCanvas = () => {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new ProcessWorker()
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const process = async (state: State, refreshIdx?: -1): Promise<State["layers"]> => {
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

      const { ctx: _ctx, ...layerWithoutCtx } = layer

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
          refresh: refreshNext ?? refreshIdx === i
        })
      })

      currentImageData = result.processedImageData

      nextLayers[i] = {
        ...layer,
        selection: result.updatedSelection
      }
    }

    return nextLayers
  }

  return process
}

export default useProcessCanvas
