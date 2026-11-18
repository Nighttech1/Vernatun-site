/** localStorage key for Lounge AI consent (C-144). */
export const AI_CONSENT_KEY = 'vernatun.lounge.aiConsent';

export type AiConsentValue = 'granted' | 'denied' | null;

export function readAiConsent(): AiConsentValue {
  try {
    const v = localStorage.getItem(AI_CONSENT_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeAiConsent(value: 'granted' | 'denied'): void {
  try {
    localStorage.setItem(AI_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearAiConsent(): void {
  try {
    localStorage.removeItem(AI_CONSENT_KEY);
  } catch {
    /* ignore */
  }
}
