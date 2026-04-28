/* eslint-disable react-refresh/only-export-components */
/* FUCK fast refresh, i dont want too many files on my project it makes my head hurts a lot */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type Moveable from "react-moveable"

type CanvasToolbarState = ReturnType<typeof useCanvasToolbar>

export const CanvasToolbarContext = createContext<CanvasToolbarState | null>(null)

export const CanvasToolbarProvider = ({ children }: { children: ReactNode }) => {
  const value = useCanvasToolbar()
  return <CanvasToolbarContext.Provider value={value}>{children}</CanvasToolbarContext.Provider>
}

export const useCanvasToolbarContext = () => {
  const ctx = useContext(CanvasToolbarContext)
  if (!ctx) throw new Error("Must be used inside CanvasToolbarProvider")
  return ctx
}

export const useCanvasToolbar = () => {
  // to keep track of the canvas position relative to it's container and for the canvas
  // scale during zoom ins and outs
  const [frame, setFrame] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const moveableRef = useRef<Moveable>(null)

  const zoom = (direction: "in" | "out") => {
    const zoomStep = 0.1

    setFrame((prev) => {
      const nextScale = direction === "in" ? prev.scale + zoomStep : prev.scale - zoomStep

      const clampedScale = Math.min(Math.max(nextScale, 0.5), 3)

      return {
        ...prev,
        scale: clampedScale
      }
    })
  }

  const onMwheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      zoom("in")
    } else {
      zoom("out")
    }
  }

  const clearDragging = () => setIsDragging(false)

  // beforeTranslate is from onDrag event object from Moveable
  const onLeftClickDrag = (beforeTranslate: number[]) => {
    const [x, y] = beforeTranslate
    setFrame((prev) => ({
      ...prev,
      x,
      y
    }))
    setIsDragging(true)
  }

  // for the sake of updating the moveable component whenever the scale changes
  // so it wont leave a stale moveable state
  useEffect(() => {
    moveableRef.current?.updateRect()
  }, [frame.scale])

  // handle middle click panning for the moveable component
  useEffect(() => {
    let isMiddle = false

    const down = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault()
        isMiddle = true
      }
    }

    const move = (e: MouseEvent) => {
      if (!isMiddle) return

      const target = moveableRef.current?.props.target as HTMLElement | null
      if (!target) return

      const rect = target.getBoundingClientRect()

      const isInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      if (!isInside) return

      setIsDragging(true)

      setFrame((prev) => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }))

      moveableRef.current?.updateRect()
    }

    const up = (e: MouseEvent) => {
      if (e.button === 1) {
        isMiddle = false
      }
      moveableRef.current?.updateRect()
      clearDragging()
    }

    window.addEventListener("mousedown", down)
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)

    return () => {
      window.removeEventListener("mousedown", down)
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
  }, [])

  return { frame, setFrame, moveableRef, zoom, onMwheelZoom, onLeftClickDrag, isDragging, clearDragging }
}
