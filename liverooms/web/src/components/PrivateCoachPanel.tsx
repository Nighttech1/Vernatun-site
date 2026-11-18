import { useCallback, useState } from 'react';
import {
  postAiCoach,
  postAiConsent,
  postAiStt,
} from '../api/lounge';
import type { AiCoachResponse } from '../types/lounge';
import { getClientId } from '../utils/clientId';
import {
  readAiConsent,
  writeAiConsent,
  type AiConsentValue,
} from '../utils/aiConsent';

interface PrivateCoachPanelProps {
  roomId: string;
  identity: string;
  roomCefr: string;
  connected: boolean;
}

/**
 * Private AI coach (C-140…C-144). Only the author sees the result.
 * Not shared to chat / lexicon / DataChannel.
 */
export function PrivateCoachPanel({
  roomId,
  identity,
  roomCefr,
  connected,
}: PrivateCoachPanelProps) {
  const [consent, setConsent] = useState<AiConsentValue>(() => readAiConsent());
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<AiCoachResponse | null>(null);

  const persistConsent = useCallback(
    async (granted: boolean) => {
      writeAiConsent(granted ? 'granted' : 'denied');
      setConsent(granted ? 'granted' : 'denied');
      setResult(null);
      try {
        await postAiConsent({
          room: roomId,
          identity,
          clientId: getClientId(),
          granted,
        });
        setStatus(
          granted
            ? 'Согласие сохранено. Разбор видите только вы.'
            : 'AI выключен. Новые разборы не отправляются.',
        );
      } catch {
        setStatus(
          granted
            ? 'Согласие сохранено на этом устройстве (сервер недоступен).'
            : 'AI выключен на этом устройстве.',
        );
      }
    },
    [identity, roomId],
  );

  const runCoach = useCallback(async () => {
    if (consent !== 'granted') {
      setStatus('Сначала согласитесь на AI-разбор своей речи.');
      return;
    }
    const text = draft.trim();
    if (!text) {
      setStatus('Вставьте текст реплики (text-first STT).');
      return;
    }
    setBusy(true);
    setStatus('Разбираем…');
    setResult(null);
    try {
      const stt = await postAiStt({
        room: roomId,
        identity,
        text,
        consent: true,
      });
      if (!stt.ok && stt.error === 'consent_required') {
        setStatus('Нужно согласие на AI.');
        return;
      }
      const transcript = (stt.transcript || text).trim();
      const coach = await postAiCoach({
        room: roomId,
        identity,
        text: transcript,
        consent: true,
        lang: 'ru',
        cefr: roomCefr || 'any',
      });
      setResult(coach);
      if (!coach.ok) {
        setStatus(
          coach.hint ||
            coach.error ||
            'Разбор временно недоступен — комната работает как обычно.',
        );
      } else if (coach.degraded) {
        setStatus(
          coach.toxicity
            ? 'Разбор готов (заглушка). Помечен фрагмент для host — без auto-kick.'
            : 'Разбор готов (заглушка без LLM). Только вы это видите.',
        );
      } else {
        setStatus(
          coach.toxicity
            ? 'Разбор готов. Помечен фрагмент для host — без auto-kick.'
            : 'Разбор готов. Только вы это видите.',
        );
      }
    } catch {
      setStatus(
        'Разбор временно недоступен — микрофон, чат и словарь работают дальше.',
      );
    } finally {
      setBusy(false);
    }
  }, [consent, draft, identity, roomCefr, roomId]);

  return (
    <div className="coach-panel">
      <p className="room-side-stub-title">Мой разбор</p>
      <p className="coach-panel-lead">
        Приватный AI-разбор вашей реплики. Соседи и общий чат его не видят.
      </p>

      {consent !== 'granted' ? (
        <div className="ai-consent ai-consent--ask">
          <p className="ai-consent-title">Согласие на AI</p>
          <p className="ai-consent-text">
            Разрешить разбор <strong>только вашей</strong> речи? Можно выключить
            в любой момент.
          </p>
          <div className="ai-consent-actions">
            <button
              type="button"
              className="ai-consent-btn"
              disabled={!connected}
              onClick={() => void persistConsent(true)}
            >
              Согласен
            </button>
            <button
              type="button"
              className="ai-consent-btn ai-consent-btn--muted"
              onClick={() => void persistConsent(false)}
            >
              Не сейчас
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="ai-consent ai-consent--on">
            <p className="ai-consent-title">AI включён (только вы)</p>
            <div className="ai-consent-actions">
              <button
                type="button"
                className="ai-consent-btn ai-consent-btn--muted"
                onClick={() => void persistConsent(false)}
              >
                Выключить
              </button>
            </div>
          </div>
          <label className="coach-label" htmlFor="ai-coach-draft">
            Текст реплики (пока без записи голоса)
          </label>
          <textarea
            id="ai-coach-draft"
            className="coach-textarea"
            rows={4}
            value={draft}
            disabled={busy || !connected}
            placeholder="Напишите или вставьте то, что сказали…"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="coach-submit"
            disabled={busy || !connected || !draft.trim()}
            onClick={() => void runCoach()}
          >
            {busy ? 'Разбираем…' : 'Отправить на разбор'}
          </button>
        </div>
      )}

      {status && <p className="coach-status">{status}</p>}

      {result?.ok && (
        <div className="coach-result" aria-live="polite">
          {result.degraded && (
            <p className="coach-degrade">Режим заглушки (без LLM) — комната в эфире.</p>
          )}
          {result.notes && (
            <div className="coach-block">
              <p className="coach-block-title">Заметки</p>
              <p className="coach-block-body">{result.notes}</p>
            </div>
          )}
          {(result.fillers?.length ?? 0) > 0 && (
            <div className="coach-block">
              <p className="coach-block-title">Слова-паразиты</p>
              <ul className="coach-filler-list">
                {result.fillers!.map((f) => (
                  <li key={f.word}>
                    <strong>{f.word}</strong>
                    {f.alternatives?.length > 0 && (
                      <span> → {f.alternatives.join(', ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(result.alternatives?.length ?? 0) > 0 && (
            <div className="coach-block">
              <p className="coach-block-title">Как сказать естественнее</p>
              <ul className="coach-alt-list">
                {result.alternatives!.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {result.toxicity && (
            <p className="coach-toxicity-note">
              Фрагмент отмечен для ведущего (без автоматического исключения).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
