import type { Filter, FilterFunction, LSelection } from "~/types"
import { adjustGrayscale } from "../image"

export const grayscaleFilter: FilterFunction = ({ imageCanvas, layer, selectionArea }) => {
  const selection = layer.selection as LSelection<Filter.Grayscale>
  const wholeImage = imageCanvas.getImageData(0, 0, imageCanvas.canvas.width, imageCanvas.canvas.height)
  const data = wholeImage.data
  adjustGrayscale(data, selectionArea, selection.config.intensity)
  imageCanvas.putImageData(wholeImage, 0, 0)
  return { updatedSelection: layer.selection }
}
