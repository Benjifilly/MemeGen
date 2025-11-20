
export interface BaseLayer {
  id: string;
  x: number;
  y: number;
  rotation: number; // In radians
}

export interface MemeText extends BaseLayer {
  type: 'text';
  content: string;
  color: string;
  fontSize: number;
  boxWidth: number;
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
}

export interface MemeSticker extends BaseLayer {
  type: 'sticker';
  url: string;
  width: number;
  height: number;
}

export type MemeLayer = MemeText | MemeSticker;

export interface Template {
  id: string;
  url: string;
  name: string;
}

export enum Tab {
  CAPTION = 'CAPTION',
  STICKER = 'STICKER',
  EDIT = 'EDIT'
}

export interface GeneratedCaption {
  text: string;
  score?: number;
}

export interface HistoryState {
  layers: MemeLayer[];
  image: string | null;
  filter: string;
}
