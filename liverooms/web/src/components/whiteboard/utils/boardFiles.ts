export type BoardFileKind = 'image' | 'pdf' | 'audio';

export type BoardFileItem = {
  id: string;
  name: string;
  kind: BoardFileKind;
  shapeId: string;
  addedAt: number;
};
