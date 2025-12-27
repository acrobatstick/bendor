import { Copy, MoveDown, MoveUp } from "lucide-react"
import { useContext } from "react"
import { Tooltip } from "react-tooltip"
import styled from "styled-components"
import { useLoading } from "~/hooks/useLoading"
import { useStore } from "~/hooks/useStore"
import { ShepherdTourContext } from "~/providers/shepherd/shepherdContext"
import { StoreActionType } from "~/providers/store/reducer"
import { FlexEnd } from "~/styles/global"
import { filterNameRegistry } from "~/utils/filters/registry"
import Button from "./reusables/buttons"
import { Label, Text } from "./reusables/typography"

function LayerList() {
  const { loading, start, stop } = useLoading()
  const {
    state: { selectedLayerIdx, imgCtx, layers },
    dispatch
  } = useStore()

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

  const onMoveSelection = (direction: "up" | "down", idx: number) => {
    start()
    dispatch({
      type: StoreActionType.MoveLayer,
      payload: { direction, layerIdx: idx }
    })
    dispatch({ type: StoreActionType.ResetImageCanvas })
    dispatch({ type: StoreActionType.GenerateResult })
    stop()
  }

  const onRefresh = () => {
    dispatch({ type: StoreActionType.ResetImageCanvas })
    dispatch({ type: StoreActionType.GenerateResult, payload: { refreshIdx: 0 } })
  }

  const onDuplicateLayer = (idx: number) => {
    dispatch({ type: StoreActionType.DuplicateLayer, payload: idx })
    dispatch({ type: StoreActionType.ResetImageCanvas })
    dispatch({ type: StoreActionType.GenerateResult, payload: { refreshIdx: idx } })
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
      <List>
        {layers.length > 0 ? (
          layers.map((point, idx) => (
            <Item id={`${idx}`} key={`layers-${point.color}`}>
              <Text variant="secondary" onClick={() => onSelectLayer(idx)} style={{ cursor: "pointer" }}>
                {selectedLayerIdx === idx ? "<*> " : "< > "} {filterNameRegistry[point.selection.filter]}
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
              </ActionList>
            </Item>
          ))
        ) : (
          <EmptyList>{"<empty>"}</EmptyList>
        )}
      </List>
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
  flex: 1; 
  min-height: 0;

  @media (max-width: 1280px) {
    flex: none;
    min-height: auto;
  }
`

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

const Action = styled.span`
  display: flex;
  align-items: center;
  padding: 4px;
  cursor: pointer;
  &:hover {
    background-color: #ccc ;
  };
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
