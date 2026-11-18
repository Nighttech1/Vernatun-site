import { useEffect, useState } from 'react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsOfServiceModal } from './TermsOfServiceModal';

type Props = {
  open: boolean;
  roomTitle?: string;
  busy?: boolean;
  error?: string;
  onConfirm: (flags: { isAdult: boolean; termsAccepted: boolean }) => void;
};

const DISCLAIMER =
  'Комнаты модерируются. Любые попытки размещения противоправного контента, политической агитации и оскорблений фиксируются в журналах безопасности (с сохранением технических идентификаторов и сетевых адресов) и влекут пожизненную блокировку.';

/**
 * C-204 / TASK: Entry gate — one checkbox, mandatory disclaimer, CTA disabled until checked.
 */
export function LegalGateModal({
  open,
  roomTitle,
  busy,
  error,
  onConfirm,
}: Props) {
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setAccepted(false);
      setTermsOpen(false);
      setPrivacyOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const canEnter = accepted && !busy;

  return (
    <>
      <div
        className="legal-gate-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-gate-title"
      >
        <div className="legal-gate-card">
          <p className="legal-gate-eyebrow">Кампус · 18+</p>
          <h1 id="legal-gate-title" className="legal-gate-title">
            Перед входом в комнату
          </h1>
          {roomTitle ? (
            <p className="legal-gate-room">Комната: {roomTitle}</p>
          ) : null}

          <div className="legal-gate-disclaimer" role="note">
            <span className="legal-gate-disclaimer-badge">Важно</span>
            <p>{DISCLAIMER}</p>
          </div>

          <label className="legal-gate-check">
            <input
              type="checkbox"
              checked={accepted}
              disabled={busy}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span className="legal-gate-check-copy">
              <span className="legal-gate-check-line">
                Мне исполнилось 18 лет. Я ознакомлен(а) и принимаю условия
              </span>
              <span className="legal-gate-check-line">
                <button
                  type="button"
                  className="legal-gate-terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTermsOpen(true);
                  }}
                >
                  Пользовательского соглашения
                </button>
                {' и '}
                <button
                  type="button"
                  className="legal-gate-terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPrivacyOpen(true);
                  }}
                >
                  Политики конфиденциальности
                </button>
                .
              </span>
            </span>
          </label>

          {error ? <p className="legal-gate-error">{error}</p> : null}

          <button
            type="button"
            className="campus-btn-primary legal-gate-cta"
            disabled={!canEnter}
            onClick={() =>
              onConfirm({ isAdult: true, termsAccepted: true })
            }
          >
            {busy ? 'Сохраняем…' : 'Войти в комнату'}
          </button>
        </div>
      </div>
      <TermsOfServiceModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
      <PrivacyPolicyModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </>
  );
}
