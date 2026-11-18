import { mergedKeywords, normalizeForModeration } from '../normalize';
import type { SentinelHit, SentinelMatchContext, SentinelScanner } from '../types';

/**
 * Shield / Спам (spam): ads, invite links, URL flood, rapid stroke vandalism.
 */
const URL_RE =
  /(?:https?:\/\/|www\.)[^\s]+|(?:t\.me|telegram\.me|discord\.gg|bit\.ly|tinyurl\.com)\/[^\s]+/i;

const SPAM_PHRASES = [
  'заработок без',
  'крипта халява',
  'бесплатные деньги',
  'переходи по ссылке',
  'click here now',
  'crypto giveaway',
];

const VANDALISM_WINDOW_MS = 4000;
const VANDALISM_STROKE_MIN = 18;

export const shieldSentinel: SentinelScanner = {
  id: 'spam',
  scan(ctx: SentinelMatchContext): SentinelHit | null {
    const stamps = ctx.strokeTimestamps || [];
    if (stamps.length >= VANDALISM_STROKE_MIN) {
      const latest = stamps[stamps.length - 1];
      const windowed = stamps.filter((t) => latest - t <= VANDALISM_WINDOW_MS);
      if (windowed.length >= VANDALISM_STROKE_MIN) {
        return {
          sentinelId: 'spam',
          rule: 'heuristic:rapid_strokes',
          score: 0.7,
          snippet: `rapid_strokes:${windowed.length}`,
        };
      }
    }

    const text = ctx.text?.trim();
    if (!text) return null;
    const norm = normalizeForModeration(text);

    if (URL_RE.test(text) || URL_RE.test(norm)) {
      return {
        sentinelId: 'spam',
        rule: 're:url',
        score: 0.8,
        snippet: text.slice(0, 500),
      };
    }
    for (const p of mergedKeywords('spam', SPAM_PHRASES)) {
      if (norm.includes(p)) {
        return {
          sentinelId: 'spam',
          rule: `kw:${p}`,
          score: 0.72,
          snippet: text.slice(0, 500),
        };
      }
    }
    const urlDensity = (text.match(/https?:\/\//gi) || []).length;
    if (urlDensity >= 2) {
      return {
        sentinelId: 'spam',
        rule: 'heuristic:url_density',
        score: 0.78,
        snippet: text.slice(0, 500),
      };
    }
    return null;
  },
};
