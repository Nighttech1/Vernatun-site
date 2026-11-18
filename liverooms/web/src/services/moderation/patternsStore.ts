/** Remote sentinel keyword/regex overrides (C-229). */

export type SentinelPatternBlock = {
  label?: string;
  keywords: string[];
  patterns: string[];
};

export type SentinelPatternsMap = Record<string, SentinelPatternBlock>;

let remote: SentinelPatternsMap | null = null;

export function getRemotePatterns(id: string): SentinelPatternBlock | null {
  if (!remote) return null;
  const block = remote[id];
  if (!block) return null;
  return block;
}

export function setRemotePatterns(map: SentinelPatternsMap | null): void {
  remote = map;
}

/** Fetch public patterns; safe no-op on failure. */
export async function loadSentinelPatternsFromApi(): Promise<void> {
  try {
    const res = await fetch('/api/lounge/sentinel-patterns');
    if (!res.ok) return;
    const data = (await res.json()) as { patterns?: SentinelPatternsMap };
    if (data.patterns && typeof data.patterns === 'object') {
      remote = data.patterns;
    }
  } catch {
    /* keep defaults */
  }
}
