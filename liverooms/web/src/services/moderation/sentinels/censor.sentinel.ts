import { containsAny, mergedKeywords, normalizeForModeration } from '../normalize';
import type { SentinelHit, SentinelMatchContext, SentinelScanner } from '../types';

/** Profanity / insults — RU/EN/HY basics (non-exhaustive stubs). */
const KEYWORDS = [
  'бляд',
  'хуй',
  'хуе',
  'пизд',
  'ебан',
  'ебат',
  'ёбан',
  'сука',
  'мудак',
  'дебил',
  'идиот',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  'պիդոր',
  'հիմար',
  'գժվ',
];

export const censorSentinel: SentinelScanner = {
  id: 'tone',
  scan(ctx: SentinelMatchContext): SentinelHit | null {
    const text = ctx.text?.trim();
    if (!text) return null;
    const norm = normalizeForModeration(text);
    const kw = containsAny(norm, mergedKeywords('tone', KEYWORDS));
    if (kw) {
      return {
        sentinelId: 'tone',
        rule: `kw:${kw}`,
        score: 0.9,
        snippet: text.slice(0, 500),
      };
    }
    return null;
  },
};
