import { Redo, Trash, Undo } from "lucide-react"
import { useContext } from "react"
import styled from "styled-components"
import { useCanvasLoading } from "~/hooks/useCanvasLoading"
import { useStore } from "~/hooks/useStore"
import { ShepherdTourContext } from "~/providers/shepherd/shepherdContext"
import { StoreActionType } from "~/providers/store/reducer"
import { FlexCenter } from "~/styles/global"
import { Filter } from "~/types"
import { filterNameRegistry } from "~/utils/filters/registry"
import FilterConfigurations from "./filterConfigurations/filterConfigurations"
import Button from "./reusables/buttons"
import { Select } from "./reusables/select"
import { H4, Label } from "./reusables/typography"

const LayerSettings = () => {
  const { state, dispatch } = useStore()
  const { start } = useCanvasLoading()

  const tour = useContext(ShepherdTourContext)

  const filterList = Object.keys(Filter)

  const onChangeFilter = (idx: number, value: Filter) => {
    dispatch({
      type: StoreActionType.UpdateLayerSelection,
      payload: {
        layerIdx: idx,
        pselection: {
          filter: value
        },
        withUpdateInitialPresent: false
      }
    })
    if (tour?.isActive() && tour.getCurrentStep()?.id === "chooseEffect") {
      tour.next()
    }
    // only process layer when there is points to be processed
    if (state.currentLayer && state.currentLayer.selection.points.length > 0) {
      start()
      dispatch({ type: StoreActionType.RequestProcessing })
    }
  }

  const onDeleteLayer = () => {
    start()
    dispatch({ type: StoreActionType.DeleteLayer, payload: state.selectedLayerIdx })
    dispatch({ type: StoreActionType.RequestProcessing })
  }

  const onUndoRedo = (dir: "undo" | "redo") => {
    dispatch({ type: StoreActionType.DoLayerAction, payload: dir })
    dispatch({ type: StoreActionType.RequestProcessing })
  }

  return (
    <Container>
      <H4 style={{ marginBottom: "12px" }}>Layer Configurations</H4>
      <Label>Filter</Label>
      <Select
        id="filterList"
        $full
        onChange={(event) => onChangeFilter(state.selectedLayerIdx, event.target.value as Filter)}
        value={state.currentLayer?.selection.filter}
      >
        {filterList.map((filter) => (
          <option value={filter} key={`filter-${filter}`}>
            {filterNameRegistry[filter as Filter]}
          </option>
        ))}
      </Select>
      <FilterConfigurations />
      <Actions>
        <Button full variant="warning" onClick={onDeleteLayer}>
          <FlexCenter>
            <Trash size={16} />
            <span>Delete Layer</span>
          </FlexCenter>
        </Button>
        <Button variant="outline" type="button" onClick={() => onUndoRedo("undo")}>
          <FlexCenter>
            <Undo size={16} />
            <span>Undo</span>
          </FlexCenter>
        </Button>
        <Button variant="outline" type="button" onClick={() => onUndoRedo("redo")}>
          <FlexCenter>
            <Redo size={16} />
            <span>Redo</span>
          </FlexCenter>
        </Button>
      </Actions>
    </Container>
  )
}

const Container = styled.div`
  padding: 24px;
  flex: 1; // stretch the height until the next element
  min-height: 0;
  overflow-y: auto;
  @media (max-width: 1280px) {
    border-top: solid black 1px;
    border-top-style: dashed;
    flex: none;
    min-height: auto;
  }
`

const Actions = styled.div`
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 4px;

    & > *:first-child {
        grid-column: span 2;
    }
`

export default LayerSettings
