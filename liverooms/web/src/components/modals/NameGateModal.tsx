import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  roomTitle?: string;
  busy?: boolean;
  error?: string;
  onConfirm: (name: string) => void;
};

const MIN_LEN = 2;
const MAX_LEN = 40;

/**
 * C-233: Entry name gate — after LegalGate, before token/join.
 */
export function NameGateModal({
  open,
  roomTitle,
  busy,
  error,
  onConfirm,
}: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  if (!open) return null;

  const trimmed = name.trim();
  const valid =
    trimmed.length >= MIN_LEN && trimmed.length <= MAX_LEN && !busy;

  return (
    <div
      className="legal-gate-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-gate-title"
    >
      <div className="legal-gate-card">
        <p className="legal-gate-eyebrow">Кампус</p>
        <h1 id="name-gate-title" className="legal-gate-title">
          Как вас представить?
        </h1>
        {roomTitle ? (
          <p className="legal-gate-room">Комната: {roomTitle}</p>
        ) : null}

        <label className="name-gate-field">
          <span className="name-gate-label">Имя в комнате</span>
          <input
            type="text"
            className="name-gate-input"
            value={name}
            maxLength={MAX_LEN}
            autoComplete="nickname"
            autoFocus
            disabled={busy}
            placeholder="Например, Ани"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid) {
                e.preventDefault();
                onConfirm(trimmed);
              }
            }}
          />
          <span className="name-gate-hint">От 2 до 40 символов</span>
        </label>

        {error ? <p className="legal-gate-error">{error}</p> : null}

        <button
          type="button"
          className="campus-btn-primary legal-gate-cta"
          disabled={!valid}
          onClick={() => onConfirm(trimmed)}
        >
          {busy ? 'Входим…' : 'Войти в комнату'}
        </button>
      </div>
    </div>
  );
}
