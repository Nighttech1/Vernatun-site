export type BoardRole = 'host' | 'speaker' | 'listener';

export type BoardToolId =
  | 'select'
  | 'laser'
  | 'draw'
  | 'highlight'
  | 'eraser'
  | 'vocab'
  | 'audio'
  | 'note'
  | 'media'
  | 'stamp'
  | 'summon';

const LISTENER: BoardToolId[] = ['laser', 'stamp'];
const SPEAKER: BoardToolId[] = [
  'select',
  'laser',
  'draw',
  'highlight',
  'eraser',
  'vocab',
  'audio',
  'note',
  'stamp',
];
const HOST: BoardToolId[] = [...SPEAKER, 'media', 'summon'];

export function toolsForRole(role: BoardRole): BoardToolId[] {
  if (role === 'host') return HOST;
  if (role === 'speaker') return SPEAKER;
  return LISTENER;
}

export function canUseTool(role: BoardRole, tool: BoardToolId): boolean {
  return toolsForRole(role).includes(tool);
}

export function canDeleteLocked(role: BoardRole): boolean {
  return role === 'host';
}

export function canSummon(role: BoardRole): boolean {
  return role === 'host';
}
