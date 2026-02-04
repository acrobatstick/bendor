import type { Filter, FilterFunction, LSelection } from "~/types"
import { adjustBrightness } from "../image"

export const brightnessFilter: FilterFunction = ({ imageCanvas, lselection, selectionArea }) => {
  const selection = lselection as LSelection<Filter.Brightness>
  const wholeImage = imageCanvas.getImageData(0, 0, imageCanvas.canvas.width, imageCanvas.canvas.height)
  const data = wholeImage.data
  adjustBrightness(data, selectionArea, selection.config.intensity)
  imageCanvas.putImageData(wholeImage, 0, 0)
  return { updatedSelection: selection }
}
