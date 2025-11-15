import type { State } from "./types";

export const initialState: State = {
  imgBuf: new ArrayBuffer(),
  originalAreaData: [],
  layers: [],
  currentLayer: undefined,
  selectedLayerIdx: -1,
};
