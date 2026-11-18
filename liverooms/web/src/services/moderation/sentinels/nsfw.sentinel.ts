import { containsAny, normalizeForModeration } from '../normalize';
import type { SentinelHit, SentinelMatchContext, SentinelScanner } from '../types';

const TEXT_KEYWORDS = [
  'порно',
  'эротик',
  'голая',
  'голый',
  'nude',
  'porn',
  'nsfw',
  'xxx',
  'sex video',
  'onlyfans',
];

/**
 * Холст 18+ — image heuristic via evaluateCanvasSafety scores + text keywords.
 * Never bans; engine deletes evidence after POST.
 */
export const nsfwSentinel: SentinelScanner = {
  id: 'canvas18',
  scan(ctx: SentinelMatchContext): SentinelHit | null {
    if (ctx.nsfwHit) {
      const scores = ctx.nsfwScores || {};
      const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      return {
        sentinelId: 'canvas18',
        rule: top ? `nsfw:${top[0]}` : 'nsfw:canvas',
        score: top ? Number(top[1]) : 0.9,
        snippet: 'canvas_nsfw_hit',
      };
    }
    const text = ctx.text?.trim();
    if (!text) return null;
    const norm = normalizeForModeration(text);
    const kw = containsAny(norm, TEXT_KEYWORDS);
    if (kw) {
      return {
        sentinelId: 'canvas18',
        rule: `kw:${kw}`,
        score: 0.75,
        snippet: text.slice(0, 500),
      };
    }
    return null;
  },
};
