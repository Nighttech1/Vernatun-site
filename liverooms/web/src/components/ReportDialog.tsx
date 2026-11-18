import { useEffect, useRef, useState } from 'react';
import type { ReportReasonCode } from '../api/lounge';
import { VernatunSelect } from './VernatunSelect';

export type ReportTarget = {
  identity: string;
  clientId?: string;
  label: string;
};

export type ReportSubmitPayload = {
  body: string;
  reasonCode: ReportReasonCode;
  targetIdentity?: string;
  targetClientId?: string;
  roomLevel?: boolean;
  /** Optional user-attached JPEG (base64 without data: prefix). */
  extraJpegB64?: string;
};

/** Reasons aligned with User Agreement §6 / Campus policies. */
const REASON_OPTIONS: { code: ReportReasonCode; label: string }[] = [
  {
    code: 'HARASSMENT',
    label: 'Домогательства и назойливое поведение',
  },
  {
    code: 'OFFENSIVE_VOICE',
    label: 'Оскорбления, мат, травля в голосе или чате',
  },
  {
    code: 'DISCRIMINATION',
    label: 'Дискриминация (национальность, язык, пол, религия…)',
  },
  {
    code: 'POLITICAL_EXTREMISM',
    label: 'Политическая агитация и разжигание розни',
  },
  {
    code: 'EXTREMISM',
    label: 'Экстремистские материалы / призывы к нарушению закона',
  },
  {
    code: 'NSFW_CANVAS',
    label: 'Материалы 18+ (доска, чат, эротика / насилие)',
  },
  {
    code: 'FLOOD_SPAM',
    label: 'Спам, реклама, вредоносные ссылки',
  },
  {
    code: 'NOISE_TROLLING',
    label: 'Акустический троллинг (шум / музыка в микрофон)',
  },
  {
    code: 'BOARD_SABOTAGE',
    label: 'Порча учебной доски / саботаж занятия',
  },
  {
    code: 'ILLEGAL_CONTENT',
    label: 'Иной противоправный контент',
  },
];

interface ReportDialogProps {
  open: boolean;
  roomId: string;
  /** Peers available to report (excluding self). */
  peers: ReportTarget[];
  initialTarget?: ReportTarget | null;
  onClose: () => void;
  onSubmit: (payload: ReportSubmitPayload) => Promise<void>;
}

const ROOM_OPTION = '__room__';

function fileToJpegB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || '');
      const comma = raw.indexOf(',');
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw);
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

export function ReportDialog({
  open,
  roomId,
  peers,
  initialTarget,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const [body, setBody] = useState('');
  const [reasonCode, setReasonCode] =
    useState<ReportReasonCode>('HARASSMENT');
  const [targetKey, setTargetKey] = useState(ROOM_OPTION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shotName, setShotName] = useState('');
  const [shotB64, setShotB64] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setBody('');
    setReasonCode('HARASSMENT');
    setError('');
    setBusy(false);
    setShotName('');
    setShotB64('');
    if (fileRef.current) fileRef.current.value = '';
    if (initialTarget?.identity) {
      setTargetKey(initialTarget.identity);
    } else {
      setTargetKey(ROOM_OPTION);
    }
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open, initialTarget?.identity]);

  if (!open) return null;

  const selectedPeer =
    targetKey === ROOM_OPTION
      ? null
      : peers.find((p) => p.identity === targetKey) ||
        (initialTarget?.identity === targetKey ? initialTarget : null);

  const onFile = async (file: File | null) => {
    if (!file) {
      setShotName('');
      setShotB64('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Нужна картинка (скрин комнаты)');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Скрин слишком большой (макс. ~4 МБ)');
      return;
    }
    try {
      const b64 = await fileToJpegB64(file);
      setShotB64(b64);
      setShotName(file.name);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const submit = async () => {
    const text = body.trim();
    if (text.length < 3) {
      setError('Кратко опишите ситуацию');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit({
        body: text,
        reasonCode,
        roomLevel: targetKey === ROOM_OPTION,
        targetIdentity: selectedPeer?.identity,
        targetClientId: selectedPeer?.clientId,
        extraJpegB64: shotB64 || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div
      className="report-dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
      >
        <h2 id="report-dialog-title" className="report-dialog-title">
          Пожаловаться
        </h2>
        <p className="report-dialog-lead">
          Комната «{roomId}». Выберите, на кого жалоба и причину — текст уйдёт
          владельцу Кампуса вместе со снимком доски.
        </p>

        <label className="report-dialog-label" htmlFor="report-target">
          На кого
        </label>
        <VernatunSelect
          id="report-target"
          aria-label="На кого жалоба"
          value={targetKey}
          disabled={busy}
          onChange={setTargetKey}
          options={[
            {
              value: ROOM_OPTION,
              label: 'Проблема комнаты / без конкретного лица',
            },
            ...peers.map((p) => ({
              value: p.identity,
              label: p.label || p.identity,
            })),
          ]}
        />

        <label className="report-dialog-label" htmlFor="report-reason">
          Причина
        </label>
        <VernatunSelect
          id="report-reason"
          aria-label="Причина жалобы"
          value={reasonCode}
          disabled={busy}
          onChange={(v) => setReasonCode(v as ReportReasonCode)}
          options={REASON_OPTIONS.map((o) => ({
            value: o.code,
            label: o.label,
          }))}
        />

        <label className="report-dialog-label" htmlFor="report-body">
          Что произошло?
        </label>
        <textarea
          id="report-body"
          ref={textareaRef}
          className="report-dialog-textarea"
          rows={5}
          maxLength={2000}
          value={body}
          disabled={busy}
          placeholder="Кратко опишите ситуацию…"
          onChange={(e) => setBody(e.target.value)}
        />

        <label className="report-dialog-label" htmlFor="report-shot">
          Скрин комнаты (по желанию)
        </label>
        <input
          id="report-shot"
          ref={fileRef}
          type="file"
          accept="image/*"
          disabled={busy}
          className="report-dialog-file"
          onChange={(e) => void onFile(e.target.files?.[0] || null)}
        />
        {shotName && (
          <p className="report-dialog-file-name">Прикреплено: {shotName}</p>
        )}

        {error && <p className="report-dialog-error">{error}</p>}
        <div className="report-dialog-actions">
          <button
            type="button"
            className="campus-btn-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Отмена
          </button>
          <button
            type="button"
            className="campus-btn-primary"
            onClick={() => void submit()}
            disabled={busy}
          >
            {busy ? 'Отправка…' : 'Отправить жалобу'}
          </button>
        </div>
      </div>
    </div>
  );
}
