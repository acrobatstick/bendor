import { initialState } from "./misc";
import { Filter, type Layer, type State } from "./types";

export enum ActionType {
  SetImageBuf,
  CreateNewLayer,
  SetPointsToLayer,
  SelectLayer,
  GetSelectedLayerPoint,
  ClearLayers,
  UpdateLayer,
  DeleteLayer,
}

interface SetImageBuf {
  type: ActionType.SetImageBuf;
  payload: ArrayBuffer;
}

interface CreateNewLayer {
  type: ActionType.CreateNewLayer;
}

interface SetPointsToLayer {
  type: ActionType.SetPointsToLayer;
  payload: Pick<Layer, "start" | "points">;
}

interface SelectLayer {
  type: ActionType.SelectLayer;
  payload: number;
}

interface ClearLayers {
  type: ActionType.ClearLayers;
}

interface UpdateLayer {
  type: ActionType.UpdateLayer;
  payload: {
    layerIdx: number;
    pselection: Partial<Layer>;
  };
}

interface DeleteLayer {
  type: ActionType.DeleteLayer;
  payload: number;
}

function isInBounds(arrLen: number, idx: number): boolean {
  return idx >= 0 && idx < arrLen;
}

export type Action =
  | SetImageBuf
  | CreateNewLayer
  | SetPointsToLayer
  | SelectLayer
  | ClearLayers
  | UpdateLayer
  | DeleteLayer;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.SetImageBuf: {
      let imgBuf = state.imgBuf;
      imgBuf = action.payload;
      return { ...state, imgBuf };
    }

    case ActionType.CreateNewLayer: {
      const newLayer: Layer = {
        points: [],
        start: { x: 0, y: 0 },
        filter: Filter.None,
        ctx: null,
      };
      const nextLayers = [...state.layers, newLayer];
      const nextIdx = nextLayers.length - 1;
      return {
        ...state,
        layers: nextLayers,
        selectedSelectionIdx: nextIdx,
        currentLayer: nextLayers[nextIdx],
      };
    }

    case ActionType.SetPointsToLayer: {
      if (!isInBounds(state.layers.length, state.selectedSelectionIdx))
        return state;

      const updated = [...state.layers];
      updated[state.selectedSelectionIdx] = {
        ...updated[state.selectedSelectionIdx],
        start: action.payload.start,
        points: action.payload.points,
        filter: updated[state.selectedSelectionIdx].filter,
      };

      return {
        ...state,
        layers: updated,
      };
    }

    case ActionType.SelectLayer: {
      const idx = action.payload;
      if (!isInBounds(state.layers.length, idx)) return { ...state };
      return {
        ...state,
        selectedSelectionIdx: idx,
        currentLayer: state.layers[idx],
      };
    }

    case ActionType.UpdateLayer: {
      if (!isInBounds(state.layers.length, state.selectedSelectionIdx))
        return state;

      const updated = [...state.layers];
      updated[action.payload.layerIdx] = {
        ...updated[action.payload.layerIdx],
        ...action.payload.pselection,
      };
      const isCurrent = action.payload.layerIdx === state.selectedSelectionIdx;

      return {
        ...state,
        layers: updated,
        currentLayer: isCurrent
          ? updated[action.payload.layerIdx]
          : state.currentLayer,
      };
    }

    case ActionType.ClearLayers:
      state = initialState;
      return state;

    default:
      return state;
  }
};

export default reducer;
