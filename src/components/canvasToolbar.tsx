import { Eye, EyeOff, Move, Pen, ZoomIn, ZoomOut } from "lucide-react"
import styled from "styled-components"
import Button from "./reusables/buttons"
import { useStore } from "~/hooks/useStore"
import type { State } from "~/types"
import { StoreActionType } from "~/providers/store/reducer"
import { useCanvasToolbarContext } from "~/hooks/useCanvasToolbar"
import { useEffect, useState } from "react"

const CanvasToolbar = () => {
  const { state, dispatch } = useStore()
  const { zoom } = useCanvasToolbarContext()

  const [hideSelection, setHideSelection] = useState<boolean>(false)

  useEffect(() => {
    setHideSelection(state.hideSelectionOverlay)
  }, [state.hideSelectionOverlay])

  const changeMode = (mode: State["mode"]) => {
    dispatch({ type: StoreActionType.UpdateState, payload: { key: "mode", value: mode } })
  }

  const onHideOverlay = () => {
    dispatch({ type: StoreActionType.UpdateState, payload: { key: "hideSelectionOverlay", value: !state.hideSelectionOverlay } })
  }

  return (
    <FloatingContainer>
      <ButtonsContainer>
        <Button onClick={() => changeMode("edit")} square variant={state.mode === "edit" ? "primary" : "outline"}>
          <Pen />
        </Button>
        <Button onClick={() => changeMode("move")} square variant={state.mode === "move" ? "primary" : "outline"}>
          <Move />
        </Button>
        <Button onClick={onHideOverlay} square variant="outline">
          {hideSelection ? <EyeOff /> : <Eye />}
        </Button>
        <Button onClick={() => zoom("in")} square variant="outline">
          <ZoomIn />
        </Button>
        <Button onClick={() => zoom("out")} square variant="outline">
          <ZoomOut />
        </Button>
      </ButtonsContainer>
    </FloatingContainer>
  )
}

const FloatingContainer = styled.div`
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  border: 1px solid ${({ theme }) => theme.colors.disabled};
  padding: 16px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

// TODO: add active color button
// TODO: make eye toggle-able to Eye-Off
const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0 8px;
`

export default CanvasToolbar
