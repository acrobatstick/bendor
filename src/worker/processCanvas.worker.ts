import type { Filter, LayerWithOptionalCtx } from "~/types"
import { filterFnRegistry } from "~/utils/filters/registry"

type Request = {
  layer: LayerWithOptionalCtx
  filter: Filter
  imageData: ImageData
  selectionArea: Uint32Array<ArrayBufferLike>
  refresh: boolean
  variative: boolean
}

self.onmessage = (e: MessageEvent<Request>) => {
  const { filter, layer, imageData, selectionArea } = e.data

  const filterFn = filterFnRegistry[filter]
  if (!filterFn) {
    self.postMessage({ layer: layer.id, error: "Filter not found" })
    return
  }

  // create a temporary canvas context in the worker to draw the current image
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    self.postMessage({ layer: layer.id, error: "could not get canvas context" })
    return
  }
  ctx.putImageData(imageData, 0, 0)

  const { updatedSelection } = filterFn({
    layer,
    imageCanvas: ctx,
    selectionArea,
    refresh: e.data.refresh,
    variative: e.data.variative
  })

  const processedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  self.postMessage({ updatedSelection, processedImageData }, { transfer: [processedImageData.data.buffer] })
}
