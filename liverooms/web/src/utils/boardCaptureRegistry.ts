/**
 * C-207: register tldraw capture for reports (PNG + snapshot JSON).
 * No continuous stroke logging — only on demand.
 */
export type BoardEvidence = {
  pngB64?: string;
  jpegB64?: string;
  boardStateJson?: string;
};

type Capturer = () => Promise<BoardEvidence>;

let capturer: Capturer | null = null;

export function registerBoardCapturer(fn: Capturer | null): void {
  capturer = fn;
}

export async function captureBoardEvidence(): Promise<BoardEvidence> {
  if (!capturer) return {};
  try {
    return await capturer();
  } catch {
    return {};
  }
}
