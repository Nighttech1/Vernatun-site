import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LoungeApiError,
  fetchChat,
  postChat,
  postSentinelEnforce,
} from '../api/lounge';
import { useChatSentinel } from '../services/moderation/useChatSentinel';
import type { ChatMessage } from '../types/lounge';
import { getClientId } from '../utils/clientId';

const POLL_MS = 4000;

/** C-237: common chat emojis (RU campus). */
const EMOJI_PALETTE = [
  '😀', '😁', '😂', '🤣', '😊', '😇', '🙂', '😉',
  '😍', '🥰', '😘', '😜', '🤗', '🤔', '😅', '😢',
  '😭', '😤', '😡', '🤯', '😴', '🙌', '👏', '👍',
  '👎', '❤️', '🔥', '✨', '🎉', '🙏', '💪', '🤝',
];

interface ChatPanelProps {
  roomId: string;
  displayName: string;
  localIdentity?: string;
  connected: boolean;
  compactHeader?: boolean;
  chatBlocked?: boolean;
  onSentinelKick?: () => void;
}

function formatTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({
  roomId,
  displayName,
  localIdentity,
  connected,
  compactHeader,
  chatBlocked,
  onSentinelKick,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);
  const clientId = getClientId();
  const identity = localIdentity || displayName || 'гость';
  const { scanOutgoing } = useChatSentinel({
    roomId,
    identity,
    clientId,
    onToast: (message) => setError(message),
  });

  const scrollChat = useCallback(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const upsertMessages = useCallback(
    (list: ChatMessage[]) => {
      setMessages((prev) => {
        const next = [...prev];
        for (const m of list) {
          if (!m.id || seenIds.current.has(m.id)) continue;
          seenIds.current.add(m.id);
          next.push(m);
        }
        return next;
      });
      requestAnimationFrame(scrollChat);
    },
    [scrollChat],
  );

  const loadChat = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await fetchChat(roomId);
      const list = data.messages || [];
      seenIds.current = new Set(list.map((m) => m.id).filter(Boolean) as string[]);
      setMessages(list);
      requestAnimationFrame(scrollChat);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Чат временно недоступен');
    }
  }, [roomId, scrollChat]);

  useEffect(() => {
    void loadChat();
  }, [loadChat]);

  useEffect(() => {
    if (!roomId) return;
    const id = window.setInterval(() => void loadChat(), POLL_MS);
    return () => window.clearInterval(id);
  }, [roomId, loadChat]);

  useEffect(() => {
    if (!emojiOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [emojiOpen]);

  const enforceAndLeave = useCallback(async () => {
    try {
      await postSentinelEnforce({
        room: roomId,
        identity,
        clientId,
        action: 'kick',
      });
    } catch {
      /* still leave locally */
    }
    onSentinelKick?.();
  }, [clientId, identity, onSentinelKick, roomId]);

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setDraft((d) => d + emoji);
      setEmojiOpen(false);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy || chatBlocked) return;
    setBusy(true);
    setError('');
    try {
      // C-217 / C-240: Evidence-First chat scan — block send + kick on hit
      const sentinelHit = await scanOutgoing(text);
      if (sentinelHit) {
        setDraft('');
        setError('Контент снят модерацией');
        await enforceAndLeave();
        return;
      }
      const msg = await postChat(
        roomId,
        displayName || 'гость',
        text,
        clientId,
        identity,
      );
      upsertMessages([msg]);
      setDraft('');
      if (msg.censored) {
        setError('Сообщение отправлено с цензурой недопустимых слов.');
      }
    } catch (err) {
      if (
        err instanceof LoungeApiError &&
        err.code === 'BLOCKED_OWNER_PATTERN'
      ) {
        setDraft('');
        setError(
          err.message ||
            'Сообщение удалено. Нарушение правил — выход из комнаты.',
        );
        await enforceAndLeave();
      } else if (
        err instanceof LoungeApiError &&
        err.code === 'BLOCKED_EXTREMISM_DETECTED'
      ) {
        setError(
          'Сообщение отклонено: запрещённый контент. Попробуйте переформулировать.',
        );
      } else if (
        err instanceof LoungeApiError &&
        err.code === 'chat_restricted'
      ) {
        setError('Чат ограничен после жалоб.');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-section">
      <div
        className={`chat-header${compactHeader ? ' chat-header--compact' : ''}`}
      >
        Общий чат комнаты ({messages.length})
        <span className="chat-safety-hint"> · не личные сообщения</span>
      </div>

      <div className="chat-log" ref={logRef}>
        {messages.length === 0 && (
          <p className="chat-empty">Пока тихо — напишите первым.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="chat-message">
            <div className="chat-message-head">
              <span className="chat-name">{m.name}</span>
              {m.ts != null && (
                <span className="chat-time">{formatTime(m.ts)}</span>
              )}
            </div>
            <div className="chat-bubble">{m.text}</div>
          </div>
        ))}
      </div>

      {error && <p className="chat-error">{error}</p>}
      {chatBlocked && (
        <p className="chat-error">Чат для вас временно ограничен.</p>
      )}
      {!connected && !chatBlocked && (
        <p className="chat-connecting-hint">
          Голос ещё подключается — писать в чат уже можно.
        </p>
      )}

      <form className="chat-form" onSubmit={(e) => void sendChat(e)}>
        <div className="chat-emoji-wrap" ref={emojiWrapRef}>
          <button
            type="button"
            className="chat-emoji-btn"
            disabled={busy || Boolean(chatBlocked)}
            aria-label="Вставить эмодзи"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((v) => !v)}
          >
            🙂
          </button>
          {emojiOpen && (
            <div className="chat-emoji-popover" role="listbox" aria-label="Эмодзи">
              {EMOJI_PALETTE.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="chat-emoji-item"
                  onClick={() => insertEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          maxLength={1000}
          placeholder={
            chatBlocked ? 'Чат ограничен…' : 'Написать реплику или вопрос…'
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy || Boolean(chatBlocked)}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-send"
          disabled={busy || !draft.trim() || Boolean(chatBlocked)}
          aria-label="Отправить"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
