import { initialState } from "./misc";
import { Filter, type Layer, type State } from "./types";

export enum ActionType {
  SetOriginalAreaData,
  CreateNewLayer,
  SetPointsToLayer,
  SelectLayer,
  GetSelectedLayerPoint,
  ClearLayers,
  UpdateLayer,
  DeleteLayer,
  MoveLayer,
  GenerateFilters,
  UpdateState,
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

interface MoveLayer {
  type: ActionType.MoveLayer;
  payload: {
    direction: "up" | "down";
    layerIdx: number;
  };
}

interface GenerateFilters {
  type: ActionType.GenerateFilters;
}

interface UpdateState<K extends keyof State> {
  type: ActionType.UpdateState
  payload: {
    key: K
    value: State[K]
  }
}

function isInBounds(arrLen: number, idx: number): boolean {
  return idx >= 0 && idx < arrLen;
}

export type Action =
  | CreateNewLayer
  | SetPointsToLayer
  | SelectLayer
  | ClearLayers
  | UpdateLayer
  | DeleteLayer
  | MoveLayer
  | GenerateFilters
  | UpdateState<keyof State>;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.CreateNewLayer: {
      const newLayer: Layer = {
        points: [],
        area: [],
        start: { x: 0, y: 0 },
        filter: Filter.None,
        ctx: null,
        color: `# ${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}`,
      };
      const nextLayers = [...state.layers, newLayer];
      const nextIdx = nextLayers.length - 1;
      return {
        ...state,
        layers: nextLayers,
        selectedLayerIdx: nextIdx,
        currentLayer: nextLayers[nextIdx],
      };
    }

    case ActionType.SetPointsToLayer: {
      if (!isInBounds(state.layers.length, state.selectedLayerIdx))
        return state;

      const updated = [...state.layers];
      updated[state.selectedLayerIdx] = {
        ...updated[state.selectedLayerIdx],
        start: action.payload.start,
        points: action.payload.points,
        filter: updated[state.selectedLayerIdx].filter,
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
        selectedLayerIdx: idx,
        currentLayer: state.layers[idx],
      };
    }

    case ActionType.UpdateLayer: {
      if (!isInBounds(state.layers.length, state.selectedLayerIdx))
        return state;

      const updated = [...state.layers];
      updated[action.payload.layerIdx] = {
        ...updated[action.payload.layerIdx],
        ...action.payload.pselection,
      };
      const isCurrent = action.payload.layerIdx === state.selectedLayerIdx;

      return {
        ...state,
        layers: updated,
        currentLayer: isCurrent
          ? updated[action.payload.layerIdx]
          : state.currentLayer,
      };
    }

    case ActionType.ClearLayers:
      return {
        ...initialState,
        imgCtx: null,
        originalAreaData: []
      };

    case ActionType.DeleteLayer: {
      let selectedLayerIdx = action.payload;
      const updated = [...state.layers].filter(
        (_, idx) => idx != selectedLayerIdx
      );

      // adjust selectedLayerIdx if updated layers are empty or overflowing the array length
      if (updated.length === 0) {
        selectedLayerIdx = -1;
      } else if (selectedLayerIdx >= updated.length) {
        selectedLayerIdx = updated.length - 1;
      }

      return {
        ...state,
        layers: updated,
        selectedLayerIdx: selectedLayerIdx,
        currentLayer: updated[selectedLayerIdx],
      };
    }

    case ActionType.MoveLayer: {
      const fromIdx = action.payload.layerIdx;
      const toIdx =
        action.payload.direction === "up" ? fromIdx - 1 : fromIdx + 1;

      // prevent moving out of bounds
      if (toIdx < 0 || toIdx >= state.layers.length) return state;

      const updated = state.layers.map((layer) => ({ ...layer }));
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);

      // swap the html canvas context
      const ctxA = updated[toIdx].ctx;
      const ctxB = updated[fromIdx].ctx;

      updated[toIdx] = { ...updated[toIdx], ctx: ctxB };
      updated[fromIdx] = { ...updated[fromIdx], ctx: ctxA };

      const isCurrent = action.payload.layerIdx === state.selectedLayerIdx;
      return {
        ...state,
        layers: updated,
        selectedLayerIdx: isCurrent ? toIdx : state.selectedLayerIdx,
        currentLayer: isCurrent ? updated[toIdx] : state.currentLayer,
      };
    }

    case ActionType.GenerateFilters: {
      // get all canvas from top to bottom
      const canvases = state.layers.map(({ area, filter }) => {
        return {
          area, filter
        }
      });

      const imageCanvas = state.imgCtx;
      if (!imageCanvas) return state;

      canvases.forEach(({ area, filter }) => {
        const points = area.filter(p => p.data)
        if (points.length === 0) return;

        // find the bounding area for the selected area since we odnt know the dimension
        // for the selected area
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const { x, y } of points) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }

        const width = maxX - minX + 1
        const height = maxY - minY + 1

        const original = imageCanvas.getImageData(minX, minY, width, height);
        const data = original.data;

        switch (filter) {
          case (Filter.Tint):
            break;
          case Filter.Grayscale: {
            for (const { x, y, data: src } of points) {
              if (!src) continue;
              const avg = (src[0] + src[1] + src[2]) / 3
              const alpha = src[3]

              const localX = x - minX
              const localY = y - minY
              const index = (localY * width + localX) * 4

              data[index + 0] = avg
              data[index + 1] = avg
              data[index + 2] = avg
              data[index + 3] = alpha
            }
            break
          }
          default:
            break
        }
        imageCanvas.putImageData(original, minX, minY)
      })

      return { ...state }
    }


    case ActionType.UpdateState: {
      const { key, value } = action.payload
      return {
        ...state,
        [key]: value
      }
    }

    default:
      return state;
  }
};

export default reducer;
