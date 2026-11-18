import { useState } from 'react';
import {
  useIsSpeaking,
  useParticipants,
} from '@livekit/components-react';
import type { Participant } from 'livekit-client';

export type PeerRestrict = {
  chatBlocked?: boolean;
  boardBlocked?: boolean;
  micMuted?: boolean;
};

const AVATAR_COLORS = [
  '#c95b36',
  '#2a5a84',
  '#3d7aab',
  '#059669',
  '#d97706',
  '#be123c',
  '#7c3aed',
  '#0d9488',
];

function IconHostMod({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2 4.5 5.2v5.4c0 5.1 3.4 9.8 7.5 11.4 4.1-1.6 7.5-6.3 7.5-11.4V5.2L12 2Zm0 2.2 5.5 2.3v4.1c0 3.9-2.5 7.5-5.5 8.9-3-1.4-5.5-5-5.5-8.9V6.5L12 4.2Z" />
      <path d="M11 10.5h2v5h-2zm0-3.5h2v2h-2z" />
    </svg>
  );
}

function IconMicMuted({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 9v3a3 3 0 0 0 5.1 2.1" />
      <path d="M15 9.3V5a3 3 0 0 0-5.8-1" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
      <path d="M19 12a7 7 0 0 1-1.4 4.2" />
      <path d="M5 12a7 7 0 0 0 7 7" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function IconChatBlocked({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

function IconBoardBlocked({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 16l4.5-4.5a2 2 0 0 1 2.8 0L14 16" />
      <path d="M13 13l1.5-1.5a2 2 0 0 1 2.6-.1L21 15" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function initials(name: string): string {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || '?';
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ParticipantRow({
  participant,
  displayName,
  isMe,
  isRoomHost,
  restrict,
  hostCanModerate,
  onMute,
  onToggleChatBlock,
  onToggleBoardBlock,
  onKick,
  onMakeHost,
}: {
  participant: Participant;
  displayName?: string;
  isMe?: boolean;
  isRoomHost?: boolean;
  restrict?: PeerRestrict;
  hostCanModerate?: boolean;
  onMute?: () => void;
  onToggleChatBlock?: () => void;
  onToggleBoardBlock?: () => void;
  onKick?: () => void;
  onMakeHost?: () => void;
}) {
  const speaking = useIsSpeaking(participant);
  const name =
    displayName || participant.name || participant.identity || 'участник';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <li
      className={`participant-item${speaking ? ' is-speaking' : ''}${isMe ? ' is-me' : ''}${menuOpen ? ' is-menu-open' : ''}`}
      onClick={() => {
        if (hostCanModerate && !isMe) setMenuOpen((v) => !v);
      }}
      title={hostCanModerate && !isMe ? 'Нажмите для модерации' : undefined}
    >
      <div
        className="participant-avatar"
        style={{ background: avatarColor(name) }}
        aria-hidden
      >
        {initials(name)}
      </div>
      <div className="participant-info">
        <div className="participant-name-row">
          {restrict?.chatBlocked && (
            <span
              className="participant-restrict-icon"
              title="Чат заблокирован"
              aria-label="Чат заблокирован"
            >
              <IconChatBlocked />
            </span>
          )}
          {restrict?.boardBlocked && (
            <span
              className="participant-restrict-icon"
              title="Доска заблокирована"
              aria-label="Доска заблокирована"
            >
              <IconBoardBlocked />
            </span>
          )}
          <span className="participant-name">{name}</span>
          {isRoomHost && (
            <span
              className="participant-mod-badge"
              title="Ведущий / модератор комнаты"
              aria-label="Модератор"
            >
              <IconHostMod />
            </span>
          )}
        </div>
        <span
          className={`participant-status${speaking ? ' is-speaking' : ''}`}
        >
          {restrict?.micMuted
            ? 'Микрофон снят ведущим'
            : speaking
              ? 'Говорит…'
              : isMe
                ? 'Вы'
                : 'В комнате'}
        </span>
      </div>

      {menuOpen && hostCanModerate && (
        <div
          className="participant-mod-menu"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={() => { onMute?.(); setMenuOpen(false); }}>
            {restrict?.micMuted ? 'Вернуть микрофон' : 'Заглушить микрофон'}
          </button>
          <button type="button" role="menuitem" onClick={() => { onToggleChatBlock?.(); setMenuOpen(false); }}>
            {restrict?.chatBlocked ? 'Разблокировать чат' : 'Блокировать чат'}
          </button>
          <button type="button" role="menuitem" onClick={() => { onToggleBoardBlock?.(); setMenuOpen(false); }}>
            {restrict?.boardBlocked ? 'Разрешить доску' : 'Блокировать доску'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onMakeHost?.();
              setMenuOpen(false);
            }}
          >
            Сделать ведущим
          </button>
          <button type="button" role="menuitem" className="is-danger" onClick={() => { onKick?.(); setMenuOpen(false); }}>
            Исключить
          </button>
        </div>
      )}

      {speaking ? (
        <div className="participant-waves" aria-hidden>
          <span className="wave-bar-1" />
          <span className="wave-bar-2" />
          <span className="wave-bar-3" />
          <span className="wave-bar-4" />
        </div>
      ) : restrict?.micMuted ? (
        <span className="speak-dot speak-dot--muted" title="Микрофон снят" aria-label="Микрофон снят">
          <IconMicMuted />
        </span>
      ) : (
        <span
          className={`speak-dot${speaking ? ' is-on' : ''}`}
          title={speaking ? 'Говорит' : 'Молчит'}
        />
      )}
      {isMe && !speaking && <span className="participant-me">вы</span>}
    </li>
  );
}

function sortParticipants(a: Participant, b: Participant): number {
  const numFrom = (p: Participant) => {
    const match = (p.name || p.identity || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  };
  return numFrom(a) - numFrom(b);
}

interface ParticipantListProps {
  localDisplayName: string;
  /** C-234: live nick map from usePeerDisplayNames */
  nameById?: Record<string, string>;
  isHost?: boolean;
  hostIdentity?: string;
  restrictions?: Record<string, PeerRestrict>;
  onHostMute?: (identity: string) => void;
  onHostKick?: (identity: string) => void;
  onHostChatBlock?: (identity: string, blocked: boolean) => void;
  onHostBoardBlock?: (identity: string, blocked: boolean) => void;
  onHostTransfer?: (identity: string) => void;
}

export function ParticipantList({
  localDisplayName,
  nameById = {},
  isHost,
  hostIdentity,
  restrictions = {},
  onHostMute,
  onHostKick,
  onHostChatBlock,
  onHostBoardBlock,
  onHostTransfer,
}: ParticipantListProps) {
  const participants = useParticipants();
  const sorted = [...participants].sort(sortParticipants);

  const resolvedHost =
    hostIdentity ||
    sorted.find((p) => {
      try {
        return JSON.parse(p.metadata || '{}').role === 'host';
      } catch {
        return false;
      }
    })?.identity;

  return (
    <ul className="participant-list">
      {sorted.map((p) => {
        const r = restrictions[p.identity] || {};
        const mapped = nameById[p.identity];
        const display = p.isLocal
          ? localDisplayName
          : mapped || p.name || p.identity;
        return (
          <ParticipantRow
            key={p.identity}
            participant={p}
            displayName={display}
            isMe={p.isLocal}
            isRoomHost={p.identity === resolvedHost || (p.isLocal && isHost)}
            restrict={r}
            hostCanModerate={Boolean(isHost && !p.isLocal)}
            onMute={onHostMute ? () => onHostMute(p.identity) : undefined}
            onToggleChatBlock={
              onHostChatBlock
                ? () => onHostChatBlock(p.identity, !r.chatBlocked)
                : undefined
            }
            onToggleBoardBlock={
              onHostBoardBlock
                ? () => onHostBoardBlock(p.identity, !r.boardBlocked)
                : undefined
            }
            onKick={onHostKick ? () => onHostKick(p.identity) : undefined}
            onMakeHost={
              onHostTransfer ? () => onHostTransfer(p.identity) : undefined
            }
          />
        );
      })}
    </ul>
  );
}
