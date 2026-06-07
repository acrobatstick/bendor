import { useState } from "react"
import styled from "styled-components"

type DividerProps = {
  minSize?: number
  maxSize: number
  onResize: (width: number) => void
}

const Divider = ({ minSize = 0, maxSize, onResize }: DividerProps) => {
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = () => {
    setIsDragging(true)

    const onMouseMove = (e: MouseEvent) => {
      const width = Math.max(minSize, Math.min(maxSize, e.clientX - 330))

      if (width < 50) {
        onResize(0)
      } else {
        onResize(250)
      }
    }

    const onMouseUp = () => {
      setIsDragging(false)

      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  return <DividerOuter $isDragging={isDragging} onMouseDown={onMouseDown} />
}

const DividerOuter = styled.div<{ $isDragging: boolean }>`
  position: absolute;
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: ${({ $isDragging, theme }) => ($isDragging ? theme.colors.disabled : "transparent")};
    opacity: ${({ $isDragging }) => ($isDragging ? 0.5 : 0)};
  }

  &:hover::before {
    background-color: ${({ theme }) => theme.colors.disabled};
    opacity: 0.5;
  }
`

export default Divider
