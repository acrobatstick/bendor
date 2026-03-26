import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import {
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import { useContext } from "react"
import styled from "styled-components"
import { useCanvasLoading } from "~/hooks/useCanvasLoading"
import { useStore } from "~/hooks/useStore"
import { ShepherdTourContext } from "~/providers/shepherd/shepherdContext"
import { StoreActionType } from "~/providers/store/reducer"
import { FlexEnd } from "~/styles/global"
import { filterNameRegistry } from "~/utils/filters/registry"
import LayerItem from "./layerItem"
import Button from "./reusables/buttons"
import { Label, Text } from "./reusables/typography"
import { waitForProcessing } from "~/utils/processing";

function LayerList() {
  const { loading, start } = useCanvasLoading()
  const { state, dispatch } = useStore()

  const { selectedLayerIdx, imgCtx, layers } = state

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const tour = useContext(ShepherdTourContext)

  const onAddLayer = () => {
    if (!loading && imgCtx) {
      dispatch({ type: StoreActionType.CreateNewLayer })
    }
    if (tour?.isActive() && tour.getCurrentStep()?.id === "addLayer") {
      tour.next()
    }
  }

  const onSelectLayer = (idx: number) => {
    dispatch({ type: StoreActionType.SelectLayer, payload: idx })
  }

  const onMoveSelection = async (direction: "up" | "down", idx: number) => {
    dispatch({
      type: StoreActionType.MoveLayer,
      payload: { direction, layerIdx: idx }
    })
    await waitForProcessing()
    dispatch({ type: StoreActionType.RequestProcessing })
  }

  const onRefresh = () => {
    start()
    dispatch({ type: StoreActionType.RequestProcessing })
  }

  const onDuplicateLayer = async (idx: number) => {
    start()
    dispatch({ type: StoreActionType.DuplicateLayer, payload: idx })
    await waitForProcessing()
    dispatch({ type: StoreActionType.RequestProcessing })
  }

  const onDragEnd = async (event: DragEndEvent) => {
    start()
    const { active, over } = event
    dispatch({
      type: StoreActionType.MoveLayerIndex,
      payload: { active: Number(active.id), over: Number(over?.id) }
    })
    await waitForProcessing()
    dispatch({ type: StoreActionType.RequestProcessing })
  }

  return (
    <Container>
      <FlexEnd>
        <Label>Layers</Label>
        {layers.length > 0 && (
          <Text onClick={onRefresh} variant="secondary" style={{ cursor: "pointer" }}>
            Refresh
          </Text>
        )}
      </FlexEnd>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={layers} strategy={verticalListSortingStrategy}>
          <List>
            {layers.length > 0 ? (
              layers.map((point, idx) => (
                <LayerItem
                  idx={idx}
                  key={`layers-${point.color}`}
                  selected={selectedLayerIdx === idx}
                  onDuplicateLayer={onDuplicateLayer}
                  onMoveSelection={onMoveSelection}
                  onSelectLayer={onSelectLayer}
                >
                  {filterNameRegistry[point.selection.filter]}
                </LayerItem>
              ))
            ) : (
              <EmptyList>{"<empty>"}</EmptyList>
            )}
          </List>
        </SortableContext>
      </DndContext>
      <Button id="addNewLayer" variant="outline" type="button" $full onClick={onAddLayer}>
        + Add new layer
      </Button>
    </Container>
  )
}
const Container = styled.div`
  border-bottom: solid black 1px;
  border-bottom-style: dashed;
  padding: 24px;
  flex: 1; // stretch the height until the next element
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 1280px) {
    flex: none;
    min-height: fit-content;
    overflow-y: hidden;
  }
`

const List = styled.ul`
  margin-bottom: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1; 
  min-height: 0;

  @media (max-width: 1280px) {
    flex: none;
    min-height: auto;
  }
`

const EmptyList = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
`

export default LayerList
