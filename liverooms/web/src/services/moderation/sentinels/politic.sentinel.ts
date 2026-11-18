import { containsAny, matchRegex, mergedKeywords, mergedRegex, normalizeForModeration } from '../normalize';
import type { SentinelHit, SentinelMatchContext, SentinelScanner } from '../types';

/** Keywords / stubs — politics & geopolitical agitation (RU/EN/HY basics). */
const KEYWORDS = [
  'голосуй за',
  'партия ',
  'сша оккупа',
  'нато ',
  'зеленск',
  'путин',
  'трамп',
  'байден',
  'война с',
  'спецоперац',
  'фашист',
  'нацист',
  'геноцид',
  'референдум',
  'политическ',
  'propaganda',
  'vote for',
  'political party',
  'քաղաքական',
  'պատերազմ',
];

const PATTERNS = [
  /\b(z[\W_]*о[\W_]*в)\b/i,
  /\b(slava\s+ukrain)/i,
  /\b(russia\s+is\s+terror)/i,
];

export const politicSentinel: SentinelScanner = {
  id: 'agenda',
  scan(ctx: SentinelMatchContext): SentinelHit | null {
    const text = ctx.text?.trim();
    if (!text) return null;
    const norm = normalizeForModeration(text);
    const kw = containsAny(norm, mergedKeywords('agenda', KEYWORDS));
    if (kw) {
      return {
        sentinelId: 'agenda',
        rule: `kw:${kw}`,
        score: 0.85,
        snippet: text.slice(0, 500),
      };
    }
    const re = matchRegex(text, mergedRegex('agenda', PATTERNS));
    if (re) {
      return {
        sentinelId: 'agenda',
        rule: `re:${re}`,
        score: 0.8,
        snippet: text.slice(0, 500),
      };
    }
    return null;
  },
};
