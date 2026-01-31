import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Copy, GripVertical, MoveDown, MoveUp } from "lucide-react"
import type React from "react"
import { Tooltip } from "react-tooltip"
import styled from "styled-components"
import { Text } from "./reusables/typography"

interface ILayerItem {
  children: React.ReactNode
  selected: boolean
  idx: number
  onSelectLayer(idx: number): void
  onMoveSelection(direction: "up" | "down", idx: number): void
  onDuplicateLayer(idx: number): void
}

function LayerItem({ children, selected, onSelectLayer, onMoveSelection, onDuplicateLayer, idx }: ILayerItem) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: idx })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <Item ref={setNodeRef} style={style} {...attributes}>
      <Text variant="secondary" onClick={() => onSelectLayer(idx)} style={{ cursor: "pointer" }}>
        {selected ? "<*> " : "< > "} {children}
      </Text>
      <ActionList>
        <Action onClick={() => onMoveSelection("up", idx)}>
          <MoveUp size={16} data-tooltip-id="moveUp" data-tooltip-content="Move layer up" data-tooltip-place="bottom" />
          <Tooltip id="moveUp" className="custom-tooltip" />
        </Action>
        <Action onClick={() => onMoveSelection("down", idx)}>
          <MoveDown size={16} data-tooltip-id="moveDown" data-tooltip-content="Move layer down" data-tooltip-place="bottom" />
          <Tooltip id="moveDown" className="custom-tooltip" />
        </Action>
        <Action onClick={() => onDuplicateLayer(idx)}>
          <Copy size={16} data-tooltip-id="duplicate" data-tooltip-content="Duplicate layer" data-tooltip-place="bottom-end" />
          <Tooltip id="duplicate" className="custom-tooltip" />
        </Action>
        <Action $cursor="grab" {...listeners}>
          <GripVertical size={16} data-tooltip-id="movevert" data-tooltip-content="Drag to Move layer vertically" data-tooltip-place="bottom-end" />
          <Tooltip id="movevert" className="custom-tooltip" />
        </Action>
      </ActionList>
    </Item>
  )
}

export default LayerItem

const Item = styled.li`
  display: flex;
  justify-content: space-between;
`

const ActionList = styled.div`
  display: flex;
  align-items: center;
  justify-items: center;
  gap: 4px;
`

const Action = styled.span<{ $cursor?: string }>`
  display: flex;
  align-items: center;
  padding: 4px;
  cursor: ${({ $cursor }) => $cursor ?? "pointer"};

  &:hover {
    background-color: #ccc;
  }
`
