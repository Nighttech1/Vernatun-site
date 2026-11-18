/** Clamp floating board toolbars inside their offsetParent (board viewport). */

export function clampToolbarPos(
  x: number,
  y: number,
  el: HTMLElement,
  parent: HTMLElement,
  pad = 8,
): { x: number; y: number } {
  const pw = parent.clientWidth;
  const ph = parent.clientHeight;
  const w = el.offsetWidth || 56;
  const h = el.offsetHeight || 120;
  const maxX = Math.max(pad, pw - w - pad);
  const maxY = Math.max(pad, ph - h - pad);
  return {
    x: Math.min(maxX, Math.max(pad, x)),
    y: Math.min(maxY, Math.max(pad, y)),
  };
}
