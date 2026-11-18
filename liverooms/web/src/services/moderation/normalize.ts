/** Light obfuscation normalize (RU/EN) for keyword matching. */
import { getRemotePatterns } from './patternsStore';

export function normalizeForModeration(raw: string): string {
  let s = (raw || '').toLowerCase();
  s = s.replace(/ё/g, 'е');
  // leetspeak / lookalike latin only
  s = s.replace(/@/g, 'a');
  s = s.replace(/\$/g, 's');
  s = s.replace(/0/g, 'o');
  s = s.replace(/1/g, 'i');
  s = s.replace(/3/g, 'e');
  s = s.replace(/4/g, 'a');
  s = s.replace(/5/g, 's');
  s = s.replace(/7/g, 't');
  s = s.replace(/[^\p{L}\p{N}\s./:_-]+/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function containsAny(hay: string, needles: string[]): string | null {
  for (const n of needles) {
    if (!n) continue;
    if (hay.includes(n)) return n;
  }
  return null;
}

export function matchRegex(hay: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    if (re.test(hay)) return re.source;
  }
  return null;
}

/** Merge built-in keywords with owner-edited remote list (C-229). */
export function mergedKeywords(
  sentinelId: string,
  defaults: string[],
): string[] {
  const remote = getRemotePatterns(sentinelId);
  if (!remote || !remote.keywords?.length) return defaults;
  const set = new Set(
    [...defaults, ...remote.keywords].map((k) => k.toLowerCase().trim()).filter(Boolean),
  );
  return [...set];
}

/** Compile remote pattern strings; ignore invalid regex. */
export function mergedRegex(
  sentinelId: string,
  defaults: RegExp[],
): RegExp[] {
  const remote = getRemotePatterns(sentinelId);
  const out = [...defaults];
  if (!remote?.patterns?.length) return out;
  for (const src of remote.patterns) {
    try {
      out.push(new RegExp(src, 'i'));
    } catch {
      /* skip bad pattern */
    }
  }
  return out;
}
