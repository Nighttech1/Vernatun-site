import { containsAny, matchRegex, mergedKeywords, mergedRegex, normalizeForModeration } from '../normalize';
import type { SentinelHit, SentinelMatchContext, SentinelScanner } from '../types';

/**
 * Hate / Границы (bounds): hate symbols, harassment, PII dumps.
 * Admin title: «Границы» (user brief: Hate).
 */
const HATE_KEYWORDS = [
  'жид',
  'хач',
  'чурк',
  'нигер',
  'nigger',
  'nigga',
  'kike',
  'faggot',
  'пидор',
  'пидар',
  'гомик',
  'свинособ',
  'унтерменш',
  '14/88',
  '1488',
];

const BOUNDARY_PHRASES = [
  'напиши в лс',
  'пиши в лс',
  'в личку',
  'скинь номер',
  'твой адрес',
  'домашний адрес',
  'stop means nothing',
  'после стоп',
];

const PATTERNS = [
  /\b88\b/,
  /\b14\s*\/\s*88\b/,
  /卐/,
  /(?:\+?\d[\d\s\-()]{8,}\d)/,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
];

export const hateSentinel: SentinelScanner = {
  id: 'bounds',
  scan(ctx: SentinelMatchContext): SentinelHit | null {
    const text = ctx.text?.trim();
    if (!text) return null;
    const norm = normalizeForModeration(text);
    const hate = containsAny(
      norm,
      mergedKeywords('bounds', [...HATE_KEYWORDS, ...BOUNDARY_PHRASES]),
    );
    if (hate) {
      return {
        sentinelId: 'bounds',
        rule: `hate:${hate}`,
        score: 0.95,
        snippet: text.slice(0, 500),
      };
    }
    const re = matchRegex(text, mergedRegex('bounds', PATTERNS));
    if (re) {
      return {
        sentinelId: 'bounds',
        rule: `re:${re}`,
        score: 0.85,
        snippet: text.slice(0, 500),
      };
    }
    return null;
  },
};
