export type NsfwScores = Record<string, number>;

export type CanvasSafetyResult = {
  isAllowed: boolean;
  scores: NsfwScores;
  degraded?: boolean;
};

/** Test hook: set `window.__VERNATUN_NSFW_FORCE__ = true` to force fail. */

let modelPromise: Promise<NsfwModel | null> | null = null;

type NsfwModel = {
  classify: (
    input: HTMLCanvasElement | HTMLImageElement | ImageData,
  ) => Promise<Array<{ className: string; probability: number }>>;
};

function forceFailFlag(): boolean {
  try {
    return Boolean(window.__VERNATUN_NSFW_FORCE__);
  } catch {
    return false;
  }
}

async function loadModel(): Promise<NsfwModel | null> {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    try {
      await import('@tensorflow/tfjs');
      const nsfwjs = await import('nsfwjs');
      try {
        return await nsfwjs.load('MobileNetV2Mid');
      } catch {
        return await nsfwjs.load();
      }
    } catch (err) {
      console.warn('[nsfwScanner] model load failed, degrade open', err);
      return null;
    }
  })();
  return modelPromise;
}

function scoresFromPredictions(
  preds: Array<{ className: string; probability: number }>,
): NsfwScores {
  const scores: NsfwScores = {};
  for (const p of preds) {
    scores[p.className] = p.probability;
  }
  return scores;
}

function isUnsafe(scores: NsfwScores): boolean {
  const hentai = scores.Hentai ?? scores.hentai ?? 0;
  const porn = scores.Porn ?? scores.porn ?? 0;
  const sexy = scores.Sexy ?? scores.sexy ?? 0;
  return hentai + porn >= 0.6 || sexy >= 0.85;
}

/**
 * Downscale source canvas / element into a small bitmap for inference.
 */
function toThumbnail(
  source: HTMLCanvasElement | HTMLImageElement,
  size = 224,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d');
  if (!ctx) return out;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  try {
    ctx.drawImage(source, 0, 0, size, size);
  } catch {
    /* tainted canvas */
  }
  return out;
}

/**
 * C-172: evaluate board snapshot. On model failure → isAllowed true (graceful degrade).
 */
export async function evaluateCanvasSafety(
  canvas: HTMLCanvasElement | HTMLImageElement,
): Promise<CanvasSafetyResult> {
  if (forceFailFlag()) {
    return {
      isAllowed: false,
      scores: { Hentai: 0.5, Porn: 0.5, Sexy: 0.9, _force: 1 },
    };
  }

  const model = await loadModel();
  if (!model) {
    return { isAllowed: true, scores: {}, degraded: true };
  }

  try {
    const thumb = toThumbnail(canvas);
    const preds = await model.classify(thumb);
    const scores = scoresFromPredictions(preds);
    return { isAllowed: !isUnsafe(scores), scores };
  } catch (err) {
    console.warn('[nsfwScanner] classify failed', err);
    return { isAllowed: true, scores: {}, degraded: true };
  }
}

/** Reset singleton (tests). */
export function resetNsfwModelCache(): void {
  modelPromise = null;
}
