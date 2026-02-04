// filterWorker.js
import type { Filter, Layer } from '~/types'
import { filterFnRegistry } from '~/utils/filters/registry'

type Request = {
  layerId: number
  filter: Filter
  lselection: Layer["selection"]
  imageData: ImageData
  selectionArea: Uint32Array<ArrayBufferLike>
  refresh: boolean
}

self.onmessage = (e: MessageEvent<Request>) => {
  const { layerId, filter, lselection, imageData, selectionArea } = e.data

  const filterFn = filterFnRegistry[filter]
  if (!filterFn) {
    self.postMessage({ layerId, error: 'Filter not found' })
    return
  }

  // create a temporary canvas context in the worker to draw the current image
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    self.postMessage({ layerId, error: "could not get canvas context" })
    return
  }
  ctx.putImageData(imageData, 0, 0)

  filterFn({
    imageCanvas: ctx,
    lselection,
    selectionArea,
    refresh: e.data.refresh
  })

  const processedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  self.postMessage(processedImageData, { transfer: [processedImageData.data.buffer] })
}
