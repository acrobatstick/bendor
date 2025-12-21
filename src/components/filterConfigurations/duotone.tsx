import { useState } from "react"
import styled from "styled-components"
import { DUOTONE_CONFIG } from "~/constants"
import { useStore } from "~/hooks/useStore"
import { StoreActionType } from "~/providers/store/reducer"
import type { Duotone, Filter, LSelection } from "~/types"
import { Label } from "../reusables/typography"
import { RangeInput } from "./reusables"

type Preset = Pick<Duotone, "highlightsColor" | "shadowsColor">
type ColorPresets = Array<Preset>

// CC: https://medialoot.com/duotones/
const presets: ColorPresets = [
  { highlightsColor: "#6aff7f", shadowsColor: "#00007e" },
  { highlightsColor: "#f8be3d", shadowsColor: "#682218" },
  { highlightsColor: "#01dbfe", shadowsColor: "#7f01d3" },
  { highlightsColor: "#fbf019", shadowsColor: "#01ab6d" },
  { highlightsColor: "#fbcd20", shadowsColor: "#ff5d77" },
  { highlightsColor: "#dc4379", shadowsColor: "#11245e" },
  { highlightsColor: "#ffffff", shadowsColor: "#91cff8" },
  { highlightsColor: "#ffefb3", shadowsColor: "#290900" },
  { highlightsColor: "#acd49d", shadowsColor: "#602457" },
  { highlightsColor: "#f00e2e", shadowsColor: "#0a0505" },
  { highlightsColor: "#ef009e", shadowsColor: "#5062d6" },
  { highlightsColor: "#defcfe", shadowsColor: "#8682d9" },
  { highlightsColor: "#fdd9e2", shadowsColor: "#65b7d6" },
  { highlightsColor: "#01ab6d", shadowsColor: "#241a5f" },
  { highlightsColor: "#ff9738", shadowsColor: "#36200c" },
  { highlightsColor: "#dfb233", shadowsColor: "#2f0781" }
]

const DuotoneConfig = () => {
  const { state, dispatch } = useStore()
  const [selectedPreset, setSelectedPreset] = useState<number>(0)

  const { BRIGHTNESS_RANGE } = DUOTONE_CONFIG
  const currSelection = state.currentLayer?.selection as LSelection<Filter.Duotone>
  const conf = currSelection.config

  const onClickPreset = (idx: number) => {
    setSelectedPreset(idx)
    const preset = presets[idx]
    dispatch({
      type: StoreActionType.UpdateLayerSelection,
      payload: {
        layerIdx: state.selectedLayerIdx,
        pselection: { config: { highlightsColor: preset.highlightsColor, shadowsColor: preset.shadowsColor } as Duotone },
        withUpdateInitialPresent: false
      }
    })
    dispatch({ type: StoreActionType.ResetImageCanvas })
    dispatch({ type: StoreActionType.GenerateResult, payload: { refreshIdx: state.selectedLayerIdx } })
  }

  return (
    <Container>
      <RangeInput
        label="Brightness"
        id="brightnessIntensity"
        min={BRIGHTNESS_RANGE.min}
        max={BRIGHTNESS_RANGE.max}
        configKey="brightness"
        defaultValue={conf.brightness}
        refresh
      />
      <Scrollable>
        <Label>Color Presets</Label>
        <ColorPresetContainer>
          {presets.map((preset, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: dont care, dont give a shit
            <PresetItem preset={preset} key={idx} onClick={() => onClickPreset(idx)} selected={selectedPreset === idx}></PresetItem>
          ))}
        </ColorPresetContainer>
      </Scrollable>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  flex-direction: column;
  gap: 12px;
`

const Scrollable = styled.div`
  overflow-y: auto;
  flex: 1; 
  min-height: 0;
`

const ColorPresetContainer = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
`

interface PresetProp {
  preset: Preset
  selected?: boolean
}

const PresetItem = styled.div<PresetProp>`
  height: 90px;
  cursor: pointer;
  border: 1px solid ${({ theme, selected }) => (selected ? theme.colors.primary : "black")};
  background: linear-gradient(
    to right, 
    ${(props) => props.preset.shadowsColor} 0%, 
    ${(props) => props.preset.shadowsColor} 50%, 
    ${(props) => props.preset.highlightsColor} 50%, 
    ${(props) => props.preset.highlightsColor} 100%
  );
  position: relative;
  
  ${({ theme, selected }) =>
    selected &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme.colors.primary};
      opacity: 0.4;
      pointer-events: none;
    }
  `}
`

export default DuotoneConfig
