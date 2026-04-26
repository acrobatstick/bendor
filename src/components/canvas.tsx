import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import Moveable from "react-moveable"
import styled, { keyframes } from "styled-components"
import { useCanvasLoading } from "~/hooks/useCanvasLoading"
import useProcessCanvas from "~/hooks/useProcessCanvas"
import { useStore } from "~/hooks/useStore"
import { ShepherdTourContext } from "~/providers/shepherd/shepherdContext"
import { StoreActionType } from "~/providers/store/reducer"
import DrawManager from "~/utils/drawManager"
import { cursorInBoundingBox, getMouseCanvasCoordinates } from "~/utils/image"
import { markProcessingDone } from "~/utils/processing"

function Canvas(props: React.HTMLAttributes<HTMLDivElement>) {
  const { loading, start, stop } = useCanvasLoading()
  const { state, dispatch } = useStore()
  const tour = useContext(ShepherdTourContext)

  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const drawManagerRef = useRef<DrawManager>(new DrawManager())
  const [ongoingTouches, setOngoingTouches] = useState<Touch[]>([])
  const [selectionMovable, setSelectionMovable] = useState<boolean>(false)

  const getOngoingTouchById = useCallback((id: number) => ongoingTouches.findIndex((t) => t.identifier === id), [ongoingTouches])

  const { process, processed } = useProcessCanvas()

  useEffect(() => {
    if (state.imgBuf.byteLength === 0 || !imageCanvasRef.current) return
    const imageCanvas = imageCanvasRef.current
    const imageCtx = imageCanvas?.getContext("2d", { willReadFrequently: true })
    if (!imageCtx) return

    const container = canvasContainerRef.current
    if (!container) {
      return
    }
    // remove all previously existing canvas to avoid duplicating when changing image
    const canvases = container.querySelectorAll<HTMLCanvasElement>('[id^="drawing-canvas-"]')
    canvases.forEach((canvas) => {
      canvas.remove()
    })

    start()
    // load image
    const blob = new Blob([state.imgBuf])
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      imageCanvas.width = img.naturalWidth
      imageCanvas.height = img.naturalHeight
      imageCtx.drawImage(img, 0, 0)
      dispatch({
        type: StoreActionType.UpdateState,
        payload: { key: "imgCtx", value: imageCtx }
      })
      const wholeImageArea = new Uint8Array(img.naturalWidth * img.naturalHeight)
      wholeImageArea.fill(1)

      // set the canvas dimension the same as the image canvas
      drawManagerRef.current.cwidth = img.naturalWidth
      drawManagerRef.current.cheight = img.naturalHeight
      dispatch({
        type: StoreActionType.UpdateState,
        payload: { key: "originalImageData", value: imageCtx.getImageData(0, 0, imageCtx.canvas.width, imageCtx.canvas.height) }
      })
      stop()
    }
    img.onerror = () => {
      stop()
      console.error("Failed to load image")
    }
    img.src = url
  }, [state.imgBuf, dispatch, start, stop])

  // To register mouse events to the drawing canvas
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const activeCanvas = container.querySelector<HTMLCanvasElement>(`#drawing-canvas-${state.selectedLayerIdx}`)
    if (!activeCanvas) return

    const drawingCanvasCtx = state.currentLayer?.ctx
    if (!drawingCanvasCtx) {
      console.log("drawingCanvasCtx empty in register")
      return
    }

    const onMouseDown = (e: MouseEvent) => {
      const point = getMouseCanvasCoordinates(activeCanvas, e.clientX, e.clientY)
      drawManagerRef.current.reset()
      drawManagerRef.current.begin(point)
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!drawManagerRef.current.isDrawing) return
      const point = getMouseCanvasCoordinates(activeCanvas, e.clientX, e.clientY)
      drawManagerRef.current.update(point)
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
    }

    const onMouseUp = () => {
      if (!drawManagerRef.current.isDrawing) return
      drawManagerRef.current.finish()
      drawingCanvasCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height)
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
      start()
      requestIdleCallback(() => {
        drawManagerRef.current.getSelectArea()
        const { points, startPoint } = drawManagerRef.current
        dispatch({
          type: StoreActionType.SetPointsToLayer,
          payload: {
            points: points,
            start: startPoint!
          }
        })
        const imageCanvas = imageCanvasRef.current
        const imageCtx = imageCanvas?.getContext("2d")
        if (!imageCtx) return
        const selectionArea = drawManagerRef.current.getSelectedAreaCoords()
        dispatch({
          type: StoreActionType.UpdateLayerSelection,
          payload: {
            layerIdx: state.selectedLayerIdx,
            pselection: {
              selectionArea
            },
            withUpdateInitialPresent: true
          }
        })

        const [, , minX, minY] = drawManagerRef.current.getPointsBoundingBox()
        drawManagerRef.current.mouseStartPos = { x: minX, y: minY }

        if (tour?.isActive) {
          if (!drawManagerRef.current.isAllArea && tour.getCurrentStep()?.id === "selectArea") {
            tour.next()
          }
          if (drawManagerRef.current.isAllArea && tour.getCurrentStep()?.id === "selectAllArea") {
            tour.next()
          }
        }

        dispatch({ type: StoreActionType.RequestProcessing })
      })
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touches = e.changedTouches
      if (touches.length > 0) {
        const point = getMouseCanvasCoordinates(activeCanvas, touches[0].clientX, touches[0].clientY)
        drawManagerRef.current.reset()
        drawManagerRef.current.begin(point)
        setOngoingTouches([touches[0]])
        drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!drawManagerRef.current.isDrawing) return
      const touches = e.changedTouches
      for (let i = 0; i < touches.length; i++) {
        const idx = getOngoingTouchById(touches[i].identifier)
        if (idx >= 0) {
          const point = getMouseCanvasCoordinates(activeCanvas, touches[i].clientX, touches[i].clientY)
          drawManagerRef.current.update(point)
          setOngoingTouches((prev) => {
            const updated = [...prev]
            updated.splice(idx, 1, touches[i])
            return updated
          })
        }
      }
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!drawManagerRef.current.isDrawing) return
      e.preventDefault()
      drawManagerRef.current.finish()
      const touches = e.changedTouches
      for (let i = 0; i < touches.length; i++) {
        const idx = getOngoingTouchById(touches[i].identifier)
        if (idx >= 0) {
          setOngoingTouches((prev) => prev.filter((_, j) => j !== idx))
        }
      }
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
      start()
      requestIdleCallback(() => {
        drawManagerRef.current.getSelectArea()
        const { points, startPoint } = drawManagerRef.current
        dispatch({
          type: StoreActionType.SetPointsToLayer,
          payload: {
            points,
            start: startPoint!
          }
        })
        const imageCanvas = imageCanvasRef.current
        const imageCtx = imageCanvas?.getContext("2d")
        if (!imageCtx) return
        const selectionArea = drawManagerRef.current.getSelectedAreaCoords()
        dispatch({
          type: StoreActionType.UpdateLayerSelection,
          payload: {
            layerIdx: state.selectedLayerIdx,
            pselection: {
              selectionArea
            },
            withUpdateInitialPresent: true
          }
        })
        const [, , minX, minY] = drawManagerRef.current.getPointsBoundingBox()
        drawManagerRef.current.mouseStartPos = { x: minX, y: minY }
        if (tour?.isActive) {
          if (!drawManagerRef.current.isAllArea && tour.getCurrentStep()?.id === "selectArea") {
            tour.next()
          }
          if (drawManagerRef.current.isAllArea && tour.getCurrentStep()?.id === "selectAllArea") {
            tour.next()
          }
        }
        dispatch({ type: StoreActionType.RequestProcessing })
      })
    }

    const onTouchCancel = (e: TouchEvent) => {
      e.preventDefault()
      const touches = e.changedTouches
      for (let i = 0; i < touches.length; i++) {
        const idx = getOngoingTouchById(touches[i].identifier)
        if (idx >= 0) {
          setOngoingTouches((prev) => prev.filter((_, j) => j !== idx))
        }
      }
      drawManagerRef.current.finish()
    }

    const onMouseOut = () => {
      if (!drawManagerRef.current.isDrawing) return
      document.addEventListener("mousemove", handleMouseMoveOutside)
      document.addEventListener("mouseup", handleMouseUpOutside)
    }

    // to handle layer selection when cursor is out of the canvas offset
    const handleMouseMoveOutside = (e: MouseEvent) => {
      if (!drawManagerRef.current.isDrawing) return
      // get the rough coordinate first and clamp later
      let point = getMouseCanvasCoordinates(activeCanvas, e.clientX, e.clientY)

      // clamp point coordinate so that we only select points that are
      // within the canvas boundaries
      const canvasWidth = activeCanvas.width
      const canvasHeight = activeCanvas.height
      point = {
        // limit to only selecting within the canvas height and width
        x: Math.max(0, Math.min(canvasWidth, point.x)),
        y: Math.max(0, Math.min(canvasHeight, point.y))
      }

      drawManagerRef.current.points.push(point)
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
    }

    // same as the in element mouse up event handler
    const handleMouseUpOutside = () => {
      if (!drawManagerRef.current.isDrawing) return
      document.removeEventListener("mousemove", handleMouseMoveOutside)
      document.removeEventListener("mouseup", handleMouseUpOutside)

      drawManagerRef.current.finish()
      drawingCanvasCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height)
      drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)

      start()
      requestIdleCallback(() => {
        drawManagerRef.current.getSelectArea()
        const { points, startPoint } = drawManagerRef.current
        dispatch({
          type: StoreActionType.SetPointsToLayer,
          payload: {
            points,
            start: startPoint!
          }
        })
        const imageCanvas = imageCanvasRef.current
        const imageCtx = imageCanvas?.getContext("2d")
        if (!imageCtx) return
        const selectionArea = drawManagerRef.current.getSelectedAreaCoords()
        dispatch({
          type: StoreActionType.UpdateLayerSelection,
          payload: {
            layerIdx: state.selectedLayerIdx,
            pselection: {
              selectionArea
            },
            withUpdateInitialPresent: true
          }
        })

        dispatch({ type: StoreActionType.RequestProcessing })
      })
    }

    const ctrl = new AbortController()
    if (state.mode === "edit") {
      activeCanvas.addEventListener("mousedown", onMouseDown, ctrl)
      activeCanvas.addEventListener("mousemove", onMouseMove, ctrl)
      activeCanvas.addEventListener("mouseup", onMouseUp, ctrl)
      activeCanvas.addEventListener("touchstart", onTouchStart, ctrl)
      activeCanvas.addEventListener("touchmove", onTouchMove, ctrl)
      activeCanvas.addEventListener("touchend", onTouchEnd, ctrl)
      activeCanvas.addEventListener("touchcancel", onTouchCancel, ctrl)
      activeCanvas.addEventListener("mouseout", onMouseOut, ctrl)
    }

    return () => {
      ctrl.abort()
    }
  }, [
    state.selectedLayerIdx,
    state.currentLayer,
    state.mode,
    dispatch,
    getOngoingTouchById,
    start,
    stop,
    tour?.isActive,
    tour?.getCurrentStep,
    tour?.next
  ])

  // Handle selection render on layer index change
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const activeCanvas = container.querySelector<HTMLCanvasElement>(`#drawing-canvas-${state.selectedLayerIdx}`)

    if (!state.currentLayer?.selection) return
    const { points, start } = state.currentLayer.selection

    // when user selects a layer, sync its points into refs
    drawManagerRef.current.reset()
    drawManagerRef.current.loadSelection(points, start)

    // now redraw the overlay only if there is already a drawing canvas element for this layer
    if (activeCanvas && state.currentLayer?.ctx) {
      if (points.length === 0) {
        state.currentLayer.ctx?.clearRect(0, 0, activeCanvas?.width, activeCanvas?.height)
      }
      // mark existing layer area coordinate in areaRef
      // drawManagerRef.current.fillSelectionArea(area)
      drawManagerRef.current.renderSelection(state.currentLayer.ctx, activeCanvas, state.currentLayer!.color)
    }

    // create drawing canvas on new layer creation
    if (state.selectedLayerIdx >= 0 && !state.currentLayer?.ctx) {
      const container = canvasContainerRef.current
      if (!container) return
      const img = imageCanvasRef.current
      const drawingCanvas = document.createElement("canvas")

      // set drawing canvas dimension with the image dimension
      if (img) {
        drawingCanvas.width = img.width
        drawingCanvas.height = img.height
      }

      drawingCanvas.id = `drawing-canvas-${state.selectedLayerIdx}`
      Object.assign(drawingCanvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        cursor: "crosshair"
      })

      container.appendChild(drawingCanvas)
      const ctx = drawingCanvas.getContext("2d")
      // area is set by default to whole image dimension
      dispatch({
        type: StoreActionType.UpdateLayer,
        payload: {
          layerIdx: state.selectedLayerIdx,
          pselection: { ctx }
        }
      })
    }
  }, [state.selectedLayerIdx, state.currentLayer, state.currentLayer?.commands.present, dispatch])

  // to handle drawing movement
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const activeCanvas = container.querySelector<HTMLCanvasElement>(`#drawing-canvas-${state.selectedLayerIdx}`)
    const currentLayer = state.currentLayer
    if (!currentLayer) return
    if (!activeCanvas || !currentLayer.ctx) return

    if (state.mode === "move") {
      const drawingCanvasCtx = currentLayer.ctx
      if (!drawingCanvasCtx) {
        return
      }

      const ctx = activeCanvas.getContext("2d")
      if (!ctx) {
        return
      }

      // to determine if the cursor is inside the drawing bounding box or not
      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        const { x: mouseX, y: mouseY } = getMouseCanvasCoordinates(activeCanvas, e.clientX, e.clientY)
        const [width, height, minX, minY] = drawManagerRef.current.getPointsBoundingBox()
        const isInBound = cursorInBoundingBox({
          drawing: {
            width,
            height,
            minX,
            minY
          },
          mouse: {
            x: mouseX,
            y: mouseY
          }
        })
        if (!isInBound) return
        // if so we can start moving the drawing
        setSelectionMovable(true)
        drawManagerRef.current.mouseStartPos = { x: mouseX, y: mouseY }
      }

      const onMouseUp = (e: MouseEvent) => {
        if (!selectionMovable) return
        e.preventDefault()
        setSelectionMovable(false)
        start()
        requestIdleCallback(() => {
          drawManagerRef.current.getSelectArea()
          const { points, startPoint } = drawManagerRef.current
          dispatch({
            type: StoreActionType.SetPointsToLayer,
            payload: {
              points: points,
              start: startPoint!
            }
          })
          const imageCanvas = imageCanvasRef.current
          const imageCtx = imageCanvas?.getContext("2d", { willReadFrequently: true })
          if (!imageCtx) return
          const selectionArea = drawManagerRef.current.getSelectedAreaCoords()
          dispatch({
            type: StoreActionType.UpdateLayerSelection,
            payload: {
              layerIdx: state.selectedLayerIdx,
              pselection: {
                selectionArea
              },
              withUpdateInitialPresent: true
            }
          })
          dispatch({ type: StoreActionType.RequestProcessing })
        })
      }

      const onMouseMove = (e: MouseEvent) => {
        const { x: mouseX, y: mouseY } = getMouseCanvasCoordinates(activeCanvas, e.clientX, e.clientY)
        const mousestart = drawManagerRef.current.mouseStartPos
        if (!mousestart || !selectionMovable) {
          return
        }
        const dx = mouseX - mousestart.x
        const dy = mouseY - mousestart.y
        drawManagerRef.current.moveSelection(dx, dy)
        drawManagerRef.current.mouseStartPos = { x: mouseX, y: mouseY }
        drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, currentLayer!.color)
      }

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault()
        const touches = e.changedTouches
        if (touches.length > 0) {
          const { x: mouseX, y: mouseY } = getMouseCanvasCoordinates(activeCanvas, touches[0].clientX, touches[0].clientY)
          const [width, height, minX, minY] = drawManagerRef.current.getPointsBoundingBox()
          const isInBound = cursorInBoundingBox({
            drawing: {
              width,
              height,
              minX,
              minY
            },
            mouse: {
              x: mouseX,
              y: mouseY
            }
          })
          if (!isInBound) return
          // if so we can start moving the drawing
          setSelectionMovable(true)
          drawManagerRef.current.mouseStartPos = { x: mouseX, y: mouseY }
        }
      }

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const touches = e.changedTouches
        if (touches.length === 0) return
        const { x: mouseX, y: mouseY } = getMouseCanvasCoordinates(activeCanvas, touches[0].clientX, touches[0].clientY)
        const mousestart = drawManagerRef.current.mouseStartPos
        if (!mousestart || !selectionMovable) {
          return
        }
        const dx = mouseX - mousestart.x
        const dy = mouseY - mousestart.y
        drawManagerRef.current.moveSelection(dx, dy)
        drawManagerRef.current.mouseStartPos = { x: mouseX, y: mouseY }
        drawManagerRef.current.renderSelection(drawingCanvasCtx, activeCanvas, state.currentLayer!.color)
      }

      const onTouchEnd = (e: TouchEvent) => {
        if (!selectionMovable) return
        e.preventDefault()
        setSelectionMovable(false)
        start()
        requestIdleCallback(() => {
          drawManagerRef.current.getSelectArea()
          const { points, startPoint } = drawManagerRef.current
          dispatch({
            type: StoreActionType.SetPointsToLayer,
            payload: {
              points: points,
              start: startPoint!
            }
          })
          const imageCanvas = imageCanvasRef.current
          const imageCtx = imageCanvas?.getContext("2d", { willReadFrequently: true })
          if (!imageCtx) return
          const selectionArea = drawManagerRef.current.getSelectedAreaCoords()
          dispatch({
            type: StoreActionType.UpdateLayerSelection,
            payload: {
              layerIdx: state.selectedLayerIdx,
              pselection: {
                selectionArea
              },
              withUpdateInitialPresent: true
            }
          })
          dispatch({ type: StoreActionType.RequestProcessing })
        })
      }

      const ctrl = new AbortController()
      activeCanvas.addEventListener("mousedown", onMouseDown, ctrl)
      activeCanvas.addEventListener("mouseup", onMouseUp, ctrl)
      activeCanvas.addEventListener("mousemove", onMouseMove, ctrl)
      activeCanvas.addEventListener("touchstart", onTouchStart, ctrl)
      activeCanvas.addEventListener("touchmove", onTouchMove, ctrl)
      activeCanvas.addEventListener("touchend", onTouchEnd, ctrl)

      return () => {
        ctrl.abort()
      }
    }
  }, [state.mode, state.currentLayer, state.selectedLayerIdx, selectionMovable, dispatch, start])

  // auto select layer whenever seletedLayerIdx changes
  useEffect(() => {
    dispatch({ type: StoreActionType.SelectLayer, payload: state.selectedLayerIdx })
  }, [state.selectedLayerIdx, dispatch])

  // to handle hide/unhide selection points
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) {
      // console.info("no container")
      return
    }
    const activeCanvas = container.querySelector<HTMLCanvasElement>(`#drawing-canvas-${state.selectedLayerIdx}`)
    const currentLayer = state.currentLayer
    if (!currentLayer) {
      // console.info("currentLayer empty")
      return
    }
    if (!activeCanvas || !currentLayer.ctx) {
      // console.info("no activeCanvas")
      return
    }
    if (state.hideSelectionOverlay) {
      currentLayer.ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height)
    } else {
      drawManagerRef.current.renderSelection(currentLayer.ctx, activeCanvas, state.currentLayer!.color)
    }
  }, [state.hideSelectionOverlay, state.currentLayer, state.selectedLayerIdx])

  // all canvas drawing processing happens here!
  useEffect(() => {
    if (!state.needsProcessing || !state.imgCtx) return
    let cancelled = false
    // only stop loading if it's not processing a gif to prevent
    // the canvas skeleton from blinking on each frame generated
    const stopLoading = () => {
      if (state.processingAs.type === "gif") return
      stop()
    }
    const run = async () => {
      // refresh all layer if processing gif otherwise just process the current layer
      // to not waste much resource
      const refreshOnIdx = state.processingAs.type === "gif" ? -1 : state.selectedLayerIdx
      const newLayers = await process(state, state.processingAs, refreshOnIdx)
      if (cancelled) return
      dispatch({
        type: StoreActionType.ApplyProcessedLayers,
        payload: newLayers
      })
      stopLoading()
    }
    run()
    return () => {
      cancelled = true
      markProcessingDone()
    }
  }, [state.needsProcessing, state.imgCtx, state.processingAs])

  const processingLayersLoading = () => {
    return (
      <>
        {state.processingAs.type === "image" ? (
          <>
            <span>Processing Layers</span>
            <span>
              {Math.min(processed, Math.max(processed, state.layers.length))}/{state.layers.length}
            </span>
          </>
        ) : (
          <>
            <span>Processing GIF Frames</span>
            <span>
              {state.processingAs.frame}/{state.processingAs.maxFrame}
            </span>
          </>
        )}
      </>
    )
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [frame, setFrame] = useState({ x: 0, y: 0, scale: 1 })
  useEffect(() => {
    if (containerRef.current && canvasContainerRef.current) {
      setTarget(canvasContainerRef.current)
    }
  }, [])

  return (
    <Container
      ref={containerRef}
      onWheel={(e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault()
        const zoomIntensity = 0.001
        const nextScale = frame.scale - e.deltaY * zoomIntensity
        const clampedScale = Math.min(Math.max(nextScale, 0.5), 3)
        if (clampedScale <= 1) {
          return
        }
        setFrame((prev) => ({
          ...prev,
          scale: clampedScale
        }))
      }}
    >
      <CanvasContainer
        id="canvasContainer"
        ref={canvasContainerRef}
        {...props}
        style={{
          transform: `translate(${frame.x}px, ${frame.y}px) scale(${frame.scale})`,
          transformOrigin: "top left"
        }}
      >
        <canvas
          id="imageCanvas"
          ref={imageCanvasRef}
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto"
          }}
        />
        <CanvasLoadingSkeleton $visible={loading}>
          <CanvasLoadingText>{processingLayersLoading()}</CanvasLoadingText>
        </CanvasLoadingSkeleton>
      </CanvasContainer>
      <Moveable
        flushSync={flushSync}
        target={target}
        draggable={state.mode === "move"}
        onDrag={({ target, transform }) => {
          target.style.transform = transform
        }}
      />
    </Container>
  )
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const CanvasLoadingSkeleton = styled.div<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.4s ease-in-out;
  pointer-events: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;

  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`

const CanvasContainer = styled.div`
  position: relative;
  display: inline-block;
  line-height: 0
`

const CanvasLoadingText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #666;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  line-height: normal;
`

export default Canvas
