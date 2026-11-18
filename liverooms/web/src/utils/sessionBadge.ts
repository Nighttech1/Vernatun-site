/** Format session remaining for lobby badges. Idle full slot → «1:30». */
export function formatSessionBadge(remainingSec: number, active: boolean): string {
  const sec = Math.max(0, Math.floor(remainingSec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (!active && h >= 1) {
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}
