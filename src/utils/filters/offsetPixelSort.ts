import type { Filter, FilterFunction, LSelection } from "~/types"
import { Color } from "../color"
import { getRandomOffset } from "../etc"

export const offsetPixelSort: FilterFunction = ({ layer, imageCanvas, selectionArea, refresh, variative }) => {
  const selection = layer.selection as LSelection<Filter.OffsetPixelSort>
  const width = imageCanvas.canvas.width
  const height = imageCanvas.canvas.height

  const distortion = variative ? getRandomOffset(selection.config.intensity, 1) : selection.config.intensity

  let sortedData: Uint8ClampedArray
  if (selection.config.cache.length === 0 || refresh) {
    // Use OffscreenCanvas instead of document.createElement
    const tempCanvas = new OffscreenCanvas(width, height)
    const tempCtx = tempCanvas.getContext("2d")!
    tempCtx.drawImage(imageCanvas.canvas, 0, 0)

    const originalCanvas = new OffscreenCanvas(width, height)
    const originalCtx = originalCanvas.getContext("2d")!
    originalCtx.drawImage(imageCanvas.canvas, 0, 0)

    const maxOffsetMarker = ((distortion * distortion) / 100) * width

    // offsetting the distorted image
    for (let i = 0; i < distortion * 2; i++) {
      const distortionY = randInt(0, height)
      const offsetDistortionHeight = Math.min(randInt(1, Math.floor(height / 4)), height - distortionY)
      const offsetRenderDist = randInt(-maxOffsetMarker, maxOffsetMarker)

      if (offsetRenderDist === 0) {
        // noop
      } else if (offsetRenderDist < 0) {
        const absOffset = -offsetRenderDist

        tempCtx.drawImage(
          originalCanvas,
          absOffset,
          distortionY,
          width + offsetRenderDist,
          offsetDistortionHeight,
          0,
          distortionY,
          width + offsetRenderDist,
          offsetDistortionHeight
        )

        tempCtx.drawImage(
          originalCanvas,
          0,
          distortionY,
          absOffset,
          offsetDistortionHeight,
          width + offsetRenderDist,
          distortionY,
          absOffset,
          offsetDistortionHeight
        )
      } else if (offsetRenderDist > 0) {
        tempCtx.drawImage(originalCanvas, 0, distortionY, width, offsetDistortionHeight, offsetRenderDist, distortionY, width, offsetDistortionHeight)

        tempCtx.drawImage(
          originalCanvas,
          width - offsetRenderDist,
          distortionY,
          offsetRenderDist,
          offsetDistortionHeight,
          0,
          distortionY,
          offsetRenderDist,
          offsetDistortionHeight
        )
      }
    }

    const outputImageData = tempCtx.getImageData(0, 0, width, height)
    const bufferedImageOutputRGBArray = outputImageData.data
    const inputImageData = originalCtx.getImageData(0, 0, width, height)
    const bufferedImageInputRGBArray = inputImageData.data

    const rgbCopyShift = randInt(0, 2)
    const distortionStartPointColumn = randInt(-distortion * 2, distortion * 2)
    const distortionStartPointRow = randInt(-distortion * 2, distortion * 2)

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const distortionStartColumnX = distortionStartPointColumn + j
        const distortionStartRowY = distortionStartPointRow + i

        if (distortionStartColumnX < 0 || distortionStartColumnX >= width || distortionStartRowY < 0 || distortionStartRowY >= height) {
          continue
        }

        const pixelCanvasPosition = (distortionStartColumnX + distortionStartRowY * width) * 4
        const inputIdx = (j + i * width) * 4

        const inputImageRGBColor = new Color(bufferedImageInputRGBArray.slice(inputIdx, inputIdx + 4))
        const outputRGBColor = new Color(bufferedImageOutputRGBArray.slice(pixelCanvasPosition, pixelCanvasPosition + 4))

        let copyColorOutput: { red: number; green: number; blue: number; alpha: number }

        if (rgbCopyShift === 0) {
          copyColorOutput = {
            red: inputImageRGBColor.red,
            green: outputRGBColor.green,
            blue: outputRGBColor.blue,
            alpha: outputRGBColor.alpha
          }
        } else if (rgbCopyShift === 1) {
          copyColorOutput = {
            red: outputRGBColor.red,
            green: inputImageRGBColor.green,
            blue: outputRGBColor.blue,
            alpha: outputRGBColor.alpha
          }
        } else {
          copyColorOutput = {
            red: outputRGBColor.red,
            green: outputRGBColor.green,
            blue: inputImageRGBColor.blue,
            alpha: outputRGBColor.alpha
          }
        }

        if (pixelCanvasPosition < 0 || pixelCanvasPosition + 4 > bufferedImageOutputRGBArray.length) {
          continue
        }

        bufferedImageOutputRGBArray[pixelCanvasPosition] = copyColorOutput.red
        bufferedImageOutputRGBArray[pixelCanvasPosition + 1] = copyColorOutput.green
        bufferedImageOutputRGBArray[pixelCanvasPosition + 2] = copyColorOutput.blue
        bufferedImageOutputRGBArray[pixelCanvasPosition + 3] = copyColorOutput.alpha
      }
    }

    tempCtx.putImageData(outputImageData, 0, 0)
    const processedImg = tempCtx.getImageData(0, 0, width, height)
    const processedData = processedImg.data
    sortedData = processedData
  } else {
    sortedData = selection.config.cache
  }

  const finalImg = imageCanvas.getImageData(0, 0, width, height)
  const finalData = finalImg.data

  for (let i = 0; i < selectionArea.length; i++) {
    const index = selectionArea[i] * 4
    const { red, green, blue, alpha } = new Color(sortedData.slice(index, index + 4))
    finalData[index] = red
    finalData[index + 1] = green
    finalData[index + 2] = blue
    finalData[index + 3] = alpha
  }

  imageCanvas.putImageData(finalImg, 0, 0)

  return {
    updatedSelection: {
      ...layer.selection,
      config: { ...selection.config, cache: sortedData }
    } as LSelection<Filter.OffsetPixelSort>
  }
}

const randInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
