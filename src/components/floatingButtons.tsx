import { Eye, Move, Redo, Undo } from "lucide-react"
import styled from "styled-components"

const FloatingButtons = () => {
  return (
    <FloatingContainer>
      <ButtonsContainer>
        <Move />
        <Eye />
        {/* TODO: Move undo redo action here from layer configuration */}
        <Undo />
        <Redo />
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

export default FloatingButtons
