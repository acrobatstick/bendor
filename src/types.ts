export enum Filter {
  Tint = "Tint",
  Grayscale = "Grayscale",
  None = "None"
}

export interface Layer {
  points: Point[];
  start: Point;
  filter: Filter;
  ctx: CanvasRenderingContext2D | null;
}

export interface State {
  imgBuf: ArrayBuffer
  layers: Layer[];
  currentLayer?: Layer;
  selectedLayerIdx: number;
}

export type Point = {
  x: number;
  y: number;
};

export type ColorChannel = Uint8Array & { readonly length: 4 }
