import { useCallback, useState } from 'react';
import { postAiConsent } from '../api/lounge';
import { getClientId } from '../utils/clientId';
import {
  readAiConsent,
  writeAiConsent,
  type AiConsentValue,
} from '../utils/aiConsent';

interface AiConsentGateProps {
  roomId: string;
  identity: string;
  consent: AiConsentValue;
  onConsentChange: (value: AiConsentValue) => void;
}

/**
 * C-144: gate before STT/coach. Host escalate / toxicity-on-report stays open.
 */
export function AiConsentGate({
  roomId,
  identity,
  consent,
  onConsentChange,
}: AiConsentGateProps) {
  const [busy, setBusy] = useState(false);

  const persist = useCallback(
    async (granted: boolean) => {
      const next: AiConsentValue = granted ? 'granted' : 'denied';
      writeAiConsent(next);
      onConsentChange(next);
      setBusy(true);
      try {
        await postAiConsent({
          room: roomId,
          identity,
          clientId: getClientId(),
          granted,
        });
      } finally {
        setBusy(false);
      }
    },
    [identity, onConsentChange, roomId],
  );

  if (consent === 'granted') {
    return (
      <div className="ai-consent ai-consent--on" role="status">
        <p className="ai-consent-text">
          AI-разбор своей речи включён. Видите только вы. Правила — раздел AI в
          ROOM_RULES комнаты.
        </p>
        <button
          type="button"
          className="ai-consent-btn ai-consent-btn--muted"
          disabled={busy}
          onClick={() => void persist(false)}
        >
          Выключить
        </button>
      </div>
    );
  }

  if (consent === 'denied') {
    return (
      <div className="ai-consent ai-consent--off" role="status">
        <p className="ai-consent-text">
          AI-разбор выключен. Эфир без изменений.
        </p>
        <button
          type="button"
          className="ai-consent-btn"
          disabled={busy}
          onClick={() => void persist(true)}
        >
          Включить разбор
        </button>
      </div>
    );
  }

  return (
    <div className="ai-consent ai-consent--ask" role="region" aria-label="Согласие на AI">
      <p className="ai-consent-title">Разбор вашей речи?</p>
      <p className="ai-consent-text">
        Короткий приватный разбор грамматики и слов-паразитов — только вам, не
        в общий чат. Можно выключить в любой момент. Подробнее — в правилах
        комнаты (секция AI).
      </p>
      <div className="ai-consent-actions">
        <button
          type="button"
          className="ai-consent-btn"
          disabled={busy}
          onClick={() => void persist(true)}
        >
          Согласен
        </button>
        <button
          type="button"
          className="ai-consent-btn ai-consent-btn--muted"
          disabled={busy}
          onClick={() => void persist(false)}
        >
          Не сейчас
        </button>
      </div>
    </div>
  );
}

/** Sync initial consent from localStorage (call once on mount). */
export function loadInitialAiConsent(): AiConsentValue {
  return readAiConsent();
}
