const STORAGE_KEY = 'vernatun-legal-consent-v1';
/** Align with backend LEGAL_CONSENT_TTL_SEC (24h default). */
const TTL_MS = 24 * 60 * 60 * 1000;

export type LegalConsentRecord = {
  consentId: string;
  clientId: string;
  acceptedAt: number;
  expiresAt: number;
};

export function readLegalConsent(clientId: string): LegalConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegalConsentRecord;
    if (!parsed?.consentId || parsed.clientId !== clientId) return null;
    if (Date.now() > (parsed.expiresAt || 0)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasValidLegalConsent(clientId: string): boolean {
  return Boolean(readLegalConsent(clientId));
}

export function writeLegalConsent(
  clientId: string,
  consentId: string,
): LegalConsentRecord {
  const now = Date.now();
  const record: LegalConsentRecord = {
    consentId,
    clientId,
    acceptedAt: now,
    expiresAt: now + TTL_MS,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* private mode */
  }
  return record;
}

export function clearLegalConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
