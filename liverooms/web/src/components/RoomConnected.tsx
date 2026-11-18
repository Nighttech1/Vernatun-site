import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { ConnectionState, DisconnectReason, RoomEvent } from 'livekit-client';
import { BoardPanel } from './BoardPanel';
import { ParticipantList } from './ParticipantList';
import { RoomSidePanel } from './RoomSidePanel';
import { cefrLabel } from '../utils/cefr';
import {
  type LexiconCard,
  type VernMsg,
  publishVernMsg,
  subscribeVernData,
} from '../utils/roomDataChannel';
import {
  fetchChat,
  fetchSession,
  postHostEnsure,
  postHostTransfer,
  postModeration,
  postReport,
  postSessionVacate,
} from '../api/lounge';
import type { BoardFileItem } from './whiteboard/utils/boardFiles';
import type { PeerRestrict } from './ParticipantList';
import type { LeaveReason } from '../types/lounge';
import { getClientId } from '../utils/clientId';
import { captureBoardEvidence } from '../utils/boardCaptureRegistry';
import {
  ReportDialog,
  type ReportSubmitPayload,
  type ReportTarget,
} from './ReportDialog';
import { clearBoardPersistence } from '../hooks/useLivekitTldrawSync';
import { usePeerDisplayNames } from '../hooks/usePeerDisplayNames';

type MobileTab = 'participants' | 'center' | 'chat';

const SIDE_W_KEY = 'vernatun-room-side-w';
const SIDE_W_DEFAULT = 360;
const SIDE_W_MIN = 280;
const SIDE_W_MAX = 560;

function loadSideWidth(): number {
  try {
    const raw = localStorage.getItem(SIDE_W_KEY);
    if (!raw) return SIDE_W_DEFAULT;
    const n = Number(raw);
    if (!Number.isFinite(n)) return SIDE_W_DEFAULT;
    return Math.min(SIDE_W_MAX, Math.max(SIDE_W_MIN, Math.round(n)));
  } catch {
    return SIDE_W_DEFAULT;
  }
}

function formatSessionLeft(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

interface RoomConnectedProps {
  roomId: string;
  roomTitle: string;
  roomCefr: string;
  displayName: string;
  localIdentity: string;
  isHost: boolean;
  shareUrl: string;
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  onLeave: () => void;
  onForcedLeave: (reason: LeaveReason) => void;
  onExitToLobby: () => void;
  onStatusChange: (status: string) => void;
  statusMessage: string;
}

function connectionStatusText(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.Connecting:
      return 'Подключаемся…';
    case ConnectionState.Connected:
      return '';
    case ConnectionState.Reconnecting:
      return 'Переподключение…';
    case ConnectionState.Disconnected:
      return 'Отключено.';
    default:
      return '';
  }
}

export function RoomConnected({
  roomId,
  roomTitle,
  roomCefr,
  displayName,
  localIdentity,
  isHost,
  shareUrl,
  mobileTab,
  onMobileTabChange,
  onLeave: _onLeave,
  onForcedLeave,
  onExitToLobby,
  onStatusChange,
  statusMessage,
}: RoomConnectedProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { nameById, resolveName } = usePeerDisplayNames(displayName);
  // C-243: live host from LiveKit metadata (not frozen join-time isHost)
  const [hostIdentityId, setHostIdentityId] = useState<string | null>(
    isHost ? localIdentity : null,
  );
  const seededHostRef = useRef(false);
  useEffect(() => {
    // Seed once from token/session; never reclaim after a transfer
    if (!seededHostRef.current && isHost) {
      seededHostRef.current = true;
      setHostIdentityId((cur) => cur || localIdentity);
    }
  }, [isHost, localIdentity]);
  useEffect(() => {
    const syncFromMeta = () => {
      for (const p of participants) {
        try {
          const m = JSON.parse(p.metadata || '{}') as { role?: string };
          if (m.role === 'host') {
            setHostIdentityId(p.identity);
            return;
          }
        } catch {
          /* ignore */
        }
      }
    };
    syncFromMeta();
    const onMeta = () => syncFromMeta();
    room.on(RoomEvent.ParticipantMetadataChanged, onMeta);
    room.on(RoomEvent.ParticipantConnected, onMeta);
    room.on(RoomEvent.ParticipantDisconnected, onMeta);
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, onMeta);
      room.off(RoomEvent.ParticipantConnected, onMeta);
      room.off(RoomEvent.ParticipantDisconnected, onMeta);
    };
  }, [room, participants]);

  // C-250: any leave → ensure host cascade (2→3→4…); retries for LiveKit race
  useEffect(() => {
    const runEnsure = () => {
      void postHostEnsure(roomId)
        .then((res) => {
          if (!res.host_identity) return;
          setHostIdentityId(res.host_identity);
          if (res.unchanged) return;
          const msg: VernMsg = {
            type: 'host.changed',
            identity: res.host_identity,
            by: 'system',
          };
          void publishVernMsg(room, msg).catch(() => undefined);
        })
        .catch(() => undefined);
    };
    const onLeft = () => {
      window.setTimeout(runEnsure, 350);
      window.setTimeout(runEnsure, 1200);
      window.setTimeout(runEnsure, 2500);
    };
    room.on(RoomEvent.ParticipantDisconnected, onLeft);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onLeft);
    };
  }, [room, roomId]);

  const hostMode = hostIdentityId === localIdentity;
  const [micOn, setMicOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sessionLeft, setSessionLeft] = useState<number | null>(null);
  const [sessionLabel, setSessionLabel] = useState('1:30:00');

  const [lexicon, setLexicon] = useState<LexiconCard[]>([]);
  const [boardFiles, setBoardFiles] = useState<BoardFileItem[]>([]);
  const [focusShapeId, setFocusShapeId] = useState<string | null>(null);
  const [restrictions, setRestrictions] = useState<Record<string, PeerRestrict>>(
    {},
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [brushLockedUntil, setBrushLockedUntil] = useState(0);
  const [nsfwWarning, setNsfwWarning] = useState('');
  const [boardReadOnly, setBoardReadOnly] = useState(false);
  const [sideWidth, setSideWidth] = useState(loadSideWidth);
  const everConnected = useRef(false);
  const sessionEndedRef = useRef(false);
  const hadActiveSession = useRef(false);
  const resizeDrag = useRef<{ startX: number; startW: number } | null>(null);

  const connected = connectionState === ConnectionState.Connected;
  const reconnecting = connectionState === ConnectionState.Reconnecting;
  const onlineCount = participants.length;

  useEffect(() => {
    if (connected) everConnected.current = true;
  }, [connected]);

  useEffect(() => {
    const onDisc = (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
        onForcedLeave('superseded');
        return;
      }
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        if (!everConnected.current) {
          onForcedLeave('error');
          onStatusChange(
            'Не удалось подключиться к эфиру. Проверьте, что сервер комнат (LiveKit) запущен на этом компьютере.',
          );
          return;
        }
        onForcedLeave('kicked');
        return;
      }
      if (
        reason === DisconnectReason.ROOM_DELETED ||
        reason === DisconnectReason.ROOM_CLOSED ||
        reason === DisconnectReason.STATE_MISMATCH ||
        reason === DisconnectReason.SERVER_SHUTDOWN
      ) {
        onForcedLeave('ended');
        return;
      }
      if (reason === DisconnectReason.CLIENT_INITIATED) {
        onExitToLobby();
        return;
      }
      // SFU down / network before first connect → clear error, not silent lobby dump
      if (!everConnected.current) {
        onForcedLeave('error');
        onStatusChange(
          'Сервер голосовых комнат сейчас недоступен. Подождите минуту и нажмите «Войти» ещё раз.',
        );
        return;
      }
      onExitToLobby();
    };
    room.on(RoomEvent.Disconnected, onDisc);
    return () => {
      room.off(RoomEvent.Disconnected, onDisc);
    };
  }, [room, onForcedLeave, onExitToLobby, onStatusChange]);

  // C-255: tab close / refresh — keepalive vacate (force if alone)
  useEffect(() => {
    const onPageHide = () => {
      const alone =
        participants.filter((p) => !p.isLocal && p.identity !== localIdentity)
          .length === 0;
      void postSessionVacate(roomId, localIdentity, { forceEmpty: alone });
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [roomId, localIdentity, participants]);

  const [remoteCamera, setRemoteCamera] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [remotePdfPage, setRemotePdfPage] = useState<number | null>(null);

  const applyVernMsg = useCallback((msg: VernMsg) => {
    if (msg.type === 'lexicon.add') {
      setLexicon((prev) => {
        if (prev.some((c) => c.id === msg.id || (c.hy === msg.hy && c.ru === msg.ru))) {
          return prev;
        }
        const card: LexiconCard = {
          id: msg.id,
          hy: msg.hy,
          phonetic: msg.phonetic,
          ru: msg.ru,
          tag: msg.tag,
          by: msg.by,
        };
        return [card, ...prev].slice(0, 80);
      });
      return;
    }
    if (msg.type === 'board.summon') {
      setRemoteCamera({ x: msg.x, y: msg.y, z: msg.z });
      onStatusChange(`Ведущий зовёт к своей точке доски (${msg.by})`);
      return;
    }
    if (msg.type === 'board.pdf.page') {
      setRemotePdfPage(msg.page);
      onStatusChange(`Учебник: стр. ${msg.page}/${msg.pageCount}`);
      return;
    }
    if (msg.type === 'board.lock') {
      setBoardReadOnly(Boolean(msg.locked));
      onStatusChange(
        msg.locked
          ? `Ведущий закрыл доску на просмотр (${msg.by})`
          : `Ведущий снова открыл доску (${msg.by})`,
      );
      return;
    }
    if (msg.type === 'board.clear') {
      window.dispatchEvent(new CustomEvent('vernatun-board-clear'));
      onStatusChange(`Ведущий очистил доску (${msg.by})`);
      return;
    }
    if (msg.type === 'board.purgeAuthor') {
      window.dispatchEvent(
        new CustomEvent('vernatun-board-purge-author', {
          detail: { clientId: msg.clientId },
        }),
      );
      onStatusChange(`Ведущий стёр рисунки нарушителя (${msg.by})`);
      return;
    }
    if (msg.type === 'host.changed') {
      setHostIdentityId(msg.identity);
      onStatusChange(
        msg.identity === localIdentity
          ? 'Вам передали права ведущего'
          : 'Сменился ведущий комнаты',
      );
      return;
    }
    if (msg.type === 'mod.restrict') {
      setRestrictions((prev) => {
        const cur = { ...(prev[msg.targetIdentity] || {}) };
        if (typeof msg.chatBlocked === 'boolean') cur.chatBlocked = msg.chatBlocked;
        if (typeof msg.boardBlocked === 'boolean') cur.boardBlocked = msg.boardBlocked;
        if (typeof msg.micMuted === 'boolean') cur.micMuted = msg.micMuted;
        return { ...prev, [msg.targetIdentity]: cur };
      });
      if (msg.targetIdentity === localIdentity) {
        if (msg.micMuted) {
          void localParticipant?.setMicrophoneEnabled(false);
          setMicOn(false);
          onStatusChange('Ведущий снял ваш микрофон');
        }
        if (msg.chatBlocked) onStatusChange('Ведущий ограничил ваш чат');
        if (msg.boardBlocked) onStatusChange('Ведущий ограничил вашу доску');
      }
      return;
    }
    if (msg.type === 'canvas.rollback') {
      onStatusChange(
        msg.reason ||
          'Доска: откат рисунка по модерации 18+ (у другого участника)',
      );
      window.dispatchEvent(
        new CustomEvent('vernatun-canvas-rollback', {
          detail: { by: msg.by, reason: msg.reason },
        }),
      );
    }
  }, [onStatusChange, localIdentity, localParticipant]);

  useEffect(() => {
    if (!connected) return;
    return subscribeVernData(room, {
      onMessage: (msg) => applyVernMsg(msg),
    });
  }, [connected, room, applyVernMsg]);

  useEffect(() => {
    if (!connected || !roomId) return;
    let cancelled = false;
    let endsAtSec = 0;

    const applyLeft = (left: number) => {
      if (left > 0) hadActiveSession.current = true;
      setSessionLeft(left);
      setSessionLabel(formatSessionLeft(left));
    };

    const pull = async () => {
      try {
        const s = await fetchSession(roomId);
        if (cancelled) return;
        if (s.active && s.endsAt) {
          endsAtSec = s.endsAt;
          applyLeft(Math.max(0, s.endsAt - Math.floor(Date.now() / 1000)));
        } else if (s.active) {
          endsAtSec = Math.floor(Date.now() / 1000) + (s.remainingSec || 0);
          applyLeft(s.remainingSec || 0);
        } else {
          endsAtSec = 0;
          applyLeft(0);
          if (s.ended) {
            setBoardFiles([]);
            setLexicon([]);
            onStatusChange(
              s.reason === 'timeout'
                ? 'Сессия 1.5 ч закончилась — чат и вложения очищены. Комната на месте.'
                : 'Сессия завершена — чат и вложения очищены. Комната на месте.',
            );
          }
        }
      } catch {
        /* ignore poll errors */
      }
    };

    void pull();
    const pollId = window.setInterval(pull, 15000);
    const tickId = window.setInterval(() => {
      if (!endsAtSec) return;
      applyLeft(Math.max(0, endsAtSec - Math.floor(Date.now() / 1000)));
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.clearInterval(tickId);
    };
  }, [connected, roomId, onStatusChange]);

  useEffect(() => {
    const connText = connectionStatusText(connectionState);
    if (connectionState === ConnectionState.Connected) {
      onStatusChange(
        `Вы в комнате как «${displayName}». Включите микрофон в верхней панели.`,
      );
    } else if (connText) {
      onStatusChange(connText);
    }
  }, [connectionState, displayName, onStatusChange]);

  const toggleMic = async () => {
    if (!localParticipant || busy) return;
    if (restrictions[localIdentity]?.micMuted) {
      onStatusChange('Микрофон снят ведущим — включить нельзя, пока не снимут ограничение');
      return;
    }
    setBusy(true);
    try {
      const next = !micOn;
      await localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
      onStatusChange(
        next
          ? 'Микрофон включён. Говорите — волны слева покажут активность.'
          : 'Микрофон выключен. Вы по-прежнему слышите остальных.',
      );
    } catch (err) {
      onStatusChange(
        'Микрофон: ' + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setBusy(false);
    }
  };

  const goToRooms = async () => {
    if (busy) return;
    setBusy(true);
    // Last human in room → force close LiveKit (clears ghost "1 online")
    const alone =
      participants.filter((p) => !p.isLocal && p.identity !== localIdentity)
        .length === 0;
    try {
      // Disconnect first (avoid PARTICIPANT_REMOVED kick UI), then vacate
      await room.disconnect();
      void postSessionVacate(roomId, localIdentity, { forceEmpty: alone });
    } catch {
      void postSessionVacate(roomId, localIdentity, { forceEmpty: alone });
    } finally {
      setMicOn(false);
      setBusy(false);
      onExitToLobby();
    }
  };

  const addLexiconCard = useCallback(
    (card: { hy: string; phonetic: string; ru: string }) => {
      const msg: VernMsg = {
        type: 'lexicon.add',
        id: `lex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        hy: card.hy.slice(0, 120),
        phonetic: card.phonetic.slice(0, 120),
        ru: card.ru.slice(0, 160),
        by: displayName || localIdentity,
      };
      // Optimistic local add; peers get it via DataChannel
      applyVernMsg(msg);
      void publishVernMsg(room, msg).catch(() => undefined);
    },
    [displayName, localIdentity, room, applyVernMsg],
  );

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      window.prompt('Скопируйте ссылку:', shareUrl);
    }
  }, [shareUrl]);

  const handleModeration = useCallback(
    async (
      action: 'mute' | 'kick' | 'escalate',
      targetIdentity: string,
      targetClientId?: string,
    ) => {
      try {
        const res = await postModeration({
          room: roomId,
          action,
          targetIdentity,
          requesterIdentity: localIdentity,
          targetClientId,
          reason: action === 'escalate' ? 'host_escalate' : '',
        });
        if (action === 'kick') {
          onStatusChange(`Исключён участник ${targetIdentity}`);
        } else if (action === 'escalate') {
          onStatusChange(
            res.message ||
              (res.target_trust != null
                ? `Escalate: mute + Trust ${res.target_trust}`
                : `Escalate: mute у ${targetIdentity}`),
          );
        } else {
          onStatusChange(`Снят publish у ${targetIdentity} (mute host)`);
        }
      } catch (err) {
        onStatusChange(
          'Модерация: ' + (err instanceof Error ? err.message : String(err)),
        );
      }
    },
    [localIdentity, onStatusChange, roomId],
  );

  const openRoomReport = useCallback(() => {
    setReportTarget(null);
    setReportOpen(true);
  }, []);

  const handleReport = useCallback(
    async (payload: ReportSubmitPayload) => {
      let chatSnapshot:
        | Array<{ id?: string; name?: string; text?: string; ts?: number }>
        | undefined;
      try {
        const chat = await fetchChat(roomId);
        chatSnapshot = (chat.messages || []).slice(-10).map((m) => ({
          id: m.id,
          name: m.name,
          text: m.text,
          ts: m.ts,
        }));
      } catch {
        chatSnapshot = undefined;
      }

      const evidence = await captureBoardEvidence();
      let canvasJpegB64 = evidence.jpegB64 || evidence.pngB64;
      if (!canvasJpegB64 && payload.extraJpegB64) {
        canvasJpegB64 = payload.extraJpegB64;
      }
      const audioRef = 'audio_buffer_unavailable';

      const targetIdentity = payload.roomLevel
        ? undefined
        : payload.targetIdentity;
      const targetClientId = payload.roomLevel
        ? undefined
        : payload.targetClientId;

      const res = await postReport({
        room: roomId,
        reporterIdentity: localIdentity,
        reporterClientId: getClientId(),
        targetIdentity,
        targetClientId,
        reason: payload.roomLevel ? 'room_issue' : 'user_report',
        reasonCode: payload.reasonCode,
        body: payload.body,
        canvasJpegB64,
        extraJpegB64: payload.extraJpegB64,
        boardPngB64: evidence.pngB64,
        boardStateJson: evidence.boardStateJson,
        chatSnapshot,
        audioRef,
      });

      if (res.auto_restricted && targetIdentity) {
        const msg: VernMsg = {
          type: 'mod.restrict',
          targetIdentity,
          micMuted: true,
          boardBlocked: true,
          chatBlocked: true,
          by: 'system',
        };
        applyVernMsg(msg);
        void publishVernMsg(room, msg);
        onStatusChange(
          res.message ||
            'Жалоба принята. Участник автоматически ограничен (mic + доска).',
        );
        return;
      }

      onStatusChange(
        res.message ||
          (res.target_trust != null
            ? `Жалоба принята. Trust цели: ${res.target_trust}`
            : 'Жалоба принята'),
      );
    },
    [
      applyVernMsg,
      localIdentity,
      onStatusChange,
      room,
      roomId,
    ],
  );

  const handleNsfwViolation = useCallback(
    (detail: { scores: Record<string, number> }) => {
      setBrushLockedUntil(Date.now() + 120_000);
      setNsfwWarning(
        'Ваш рисунок заблокирован системой автоматической модерации 18+. Возможность рисования временно ограничена.',
      );
      onStatusChange('Модерация доски 18+: кисть заблокирована на 2 мин.');
      const msg: VernMsg = {
        type: 'canvas.rollback',
        by: displayName,
        reason: 'nsfw',
      };
      void publishVernMsg(room, msg);
      void detail;
    },
    [displayName, onStatusChange, room],
  );

  useEffect(() => {
    if (!brushLockedUntil) return;
    const left = brushLockedUntil - Date.now();
    if (left <= 0) {
      setBrushLockedUntil(0);
      setNsfwWarning('');
      return;
    }
    const t = window.setTimeout(() => {
      setBrushLockedUntil(0);
      setNsfwWarning('');
    }, left);
    return () => window.clearTimeout(t);
  }, [brushLockedUntil]);

  // C-231: session end → leave + wipe board persistence + lobby
  useEffect(() => {
    if (sessionLeft === null || sessionLeft > 0) return;
    if (!connected || !hadActiveSession.current || sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    void (async () => {
      try {
        await clearBoardPersistence(roomId);
      } catch {
        /* ignore */
      }
      try {
        await room.disconnect();
      } catch {
        /* ignore */
      }
      onExitToLobby();
    })();
  }, [sessionLeft, connected, room, roomId, onExitToLobby]);

  const onResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeDrag.current = { startX: e.clientX, startW: sideWidth };
  };

  const onResizePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizeDrag.current) return;
    // Dragging left grows chat; dragging right shrinks chat
    const delta = resizeDrag.current.startX - e.clientX;
    const next = Math.min(
      SIDE_W_MAX,
      Math.max(SIDE_W_MIN, Math.round(resizeDrag.current.startW + delta)),
    );
    setSideWidth(next);
  };

  const onResizePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizeDrag.current) return;
    resizeDrag.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setSideWidth((w) => {
      try {
        localStorage.setItem(SIDE_W_KEY, String(w));
      } catch {
        /* ignore */
      }
      return w;
    });
  };

  const showSessionWarn =
    connected && sessionLeft != null && sessionLeft > 0 && sessionLeft <= 600;

  return (
    <div
      className="room-session"
      style={
        {
          ['--room-side-width']: `${sideWidth}px`,
        } as CSSProperties
      }
    >
      <RoomAudioRenderer />

      {showSessionWarn && (
        <div className="room-session-end-banner" role="status">
          Сеанс закончится через {formatSessionLeft(sessionLeft!)}
        </div>
      )}

      {reconnecting && (
        <div className="room-reconnect-banner" role="status">
          Переподключение к комнате… микрофон пока выключен по умолчанию после
          восстановления.
        </div>
      )}

      {nsfwWarning && (
        <div className="room-nsfw-banner" role="alert">
          {nsfwWarning}
        </div>
      )}

      <header className="room-topbar">
        <div className="room-topbar-left">
          <button type="button" className="room-btn-exit" onClick={() => void goToRooms()}>
            <span aria-hidden>←</span>
            <span>Комнаты</span>
          </button>
          <span className="room-topbar-divider" aria-hidden />
          <div
            className={`room-live-badge${connected ? '' : ' is-connecting'}`}
          >
            <span className="room-live-dot-wrap">
              {connected && <span className="room-live-dot-ping" />}
              <span className="room-live-dot" />
            </span>
            <span className="room-live-label">
              {connected ? 'В ЭФИРЕ:' : 'ПОДКЛЮЧЕНИЕ'}
            </span>
            <span className="room-live-title">{roomTitle}</span>
          </div>
          <div className="room-meta-chips">
            {roomCefr && (
              <span className="room-meta-chip room-meta-chip--level">
                {cefrLabel(roomCefr)}
              </span>
            )}
            {connected && (
              <span
                className="room-meta-chip room-meta-chip--timer"
                title={`До конца сессии (~1.5 ч)${sessionLeft != null ? `: ${sessionLeft} с` : ''}`}
              >
                ⏱ {sessionLabel}
              </span>
            )}
            <span className="room-meta-chip room-meta-chip--online">
              <span className="room-meta-online-dot" />
              {onlineCount} онлайн
            </span>
          </div>
        </div>
        <div className="room-topbar-right">
          <button
            type="button"
            className={`room-btn-mic${micOn ? ' is-on' : ' is-off'}${restrictions[localIdentity]?.micMuted ? ' is-host-muted' : ''}`}
            onClick={toggleMic}
            disabled={
              !connected ||
              busy ||
              Boolean(restrictions[localIdentity]?.micMuted)
            }
            aria-pressed={micOn}
            aria-label={
              restrictions[localIdentity]?.micMuted
                ? 'Микрофон снят ведущим'
                : micOn
                  ? 'Выключить микрофон'
                  : 'Включить микрофон'
            }
          >
            {restrictions[localIdentity]?.micMuted
              ? 'Микрофон ✕'
              : micOn
                ? 'Микрофон ВКЛ'
                : 'Микрофон ВЫКЛ'}
          </button>
          <button
            type="button"
            className="room-btn-icon"
            onClick={copyLink}
            disabled={!roomId}
            title={linkCopied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
            aria-label="Поделиться ссылкой"
          >
            {linkCopied ? '✓' : '⎘'}
          </button>
        </div>
      </header>

      <div className="room-mobile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'participants'}
          className={`room-mobile-tab${mobileTab === 'participants' ? ' is-active' : ''}`}
          onClick={() => onMobileTabChange('participants')}
        >
          Участники ({onlineCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'center'}
          className={`room-mobile-tab${mobileTab === 'center' ? ' is-active' : ''}`}
          onClick={() => onMobileTabChange('center')}
        >
          Доска
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'chat'}
          className={`room-mobile-tab${mobileTab === 'chat' ? ' is-active' : ''}`}
          onClick={() => onMobileTabChange('chat')}
        >
          Чат
          {lexicon.length > 0 ? ` · ${lexicon.length}` : ''}
        </button>
      </div>

      <div className="room-body">
        <aside
          className={`room-col room-col--participants${mobileTab === 'participants' ? ' is-visible' : ''}`}
        >
          <div className="room-panel-head">
            <h2 className="room-panel-title">
              Участники ({onlineCount})
            </h2>
            <p className="room-panel-sub">
              {hostMode
                ? 'Вы ведущий: нажмите на участника — mute / чат / доска'
                : 'Общий чат · без личных сообщений'}
            </p>
            <button
              type="button"
              className="room-report-room-btn"
              onClick={openRoomReport}
            >
              Пожаловаться
            </button>
          </div>
          <div className="room-participants-scroll">
            <ParticipantList
              localDisplayName={displayName}
              nameById={nameById}
              isHost={hostMode}
              hostIdentity={hostIdentityId || undefined}
              restrictions={restrictions}
              onHostMute={
                hostMode
                  ? (id) => {
                      void handleModeration('mute', id);
                      const msg: VernMsg = {
                        type: 'mod.restrict',
                        targetIdentity: id,
                        micMuted: true,
                        by: displayName,
                      };
                      applyVernMsg(msg);
                      void publishVernMsg(room, msg);
                    }
                  : undefined
              }
              onHostKick={
                hostMode ? (id) => void handleModeration('kick', id) : undefined
              }
              onHostTransfer={
                hostMode
                  ? (id) => {
                      void (async () => {
                        try {
                          const res = await postHostTransfer({
                            room: roomId,
                            fromIdentity: localIdentity,
                            toIdentity: id,
                          });
                          const nextHost = res.host_identity || id;
                          setHostIdentityId(nextHost);
                          const msg: VernMsg = {
                            type: 'host.changed',
                            identity: nextHost,
                            by: displayName,
                          };
                          applyVernMsg(msg);
                          void publishVernMsg(room, msg);
                          onStatusChange('Права ведущего переданы');
                        } catch (err) {
                          onStatusChange(
                            err instanceof Error
                              ? err.message
                              : 'Не удалось передать права ведущего',
                          );
                        }
                      })();
                    }
                  : undefined
              }
              onHostChatBlock={
                hostMode
                  ? (id, blocked) => {
                      const msg: VernMsg = {
                        type: 'mod.restrict',
                        targetIdentity: id,
                        chatBlocked: blocked,
                        by: displayName,
                      };
                      applyVernMsg(msg);
                      void publishVernMsg(room, msg);
                    }
                  : undefined
              }
              onHostBoardBlock={
                hostMode
                  ? (id, blocked) => {
                      const msg: VernMsg = {
                        type: 'mod.restrict',
                        targetIdentity: id,
                        boardBlocked: blocked,
                        by: displayName,
                      };
                      applyVernMsg(msg);
                      void publishVernMsg(room, msg);
                    }
                  : undefined
              }
            />
          </div>
        </aside>

        <main
          className={`room-col room-col--center${mobileTab === 'center' ? ' is-visible' : ''}`}
        >
          <BoardPanel
            roomId={roomId}
            roomTitle={roomTitle}
            displayName={displayName}
            localIdentity={localIdentity}
            livekitRoom={room}
            statusMessage={statusMessage}
            onExitToLobby={onExitToLobby}
            boardRole={
              hostMode
                ? 'host'
                : restrictions[localIdentity]?.boardBlocked ||
                    brushLockedUntil > Date.now()
                  ? 'listener'
                  : 'speaker'
            }
            brushLocked={brushLockedUntil > Date.now()}
            boardReadOnly={boardReadOnly}
            nsfwEnabled
            onNsfwViolation={handleNsfwViolation}
            onSentinelKick={() => onForcedLeave('policy')}
            remoteCamera={remoteCamera}
            remotePdfPage={remotePdfPage}
            onBoardFilesChange={setBoardFiles}
            focusShapeId={focusShapeId}
            onHostToggleBoardLock={() => {
              const next = !boardReadOnly;
              const msg: VernMsg = {
                type: 'board.lock',
                locked: next,
                by: displayName,
              };
              applyVernMsg(msg);
              void publishVernMsg(room, msg);
            }}
            onHostClearBoard={() => {
              const msg: VernMsg = { type: 'board.clear', by: displayName };
              applyVernMsg(msg);
              void publishVernMsg(room, msg);
            }}
            onHostPurgeAuthor={(clientId) => {
              const msg: VernMsg = {
                type: 'board.purgeAuthor',
                clientId,
                by: displayName,
              };
              applyVernMsg(msg);
              void publishVernMsg(room, msg);
            }}
            onBoardSummon={(cam) => {
              const msg: VernMsg = {
                type: 'board.summon',
                x: cam.x,
                y: cam.y,
                z: cam.z,
                by: displayName,
              };
              applyVernMsg(msg);
              void publishVernMsg(room, msg);
            }}
            onBoardPdfPage={(page, pageCount) => {
              const msg: VernMsg = {
                type: 'board.pdf.page',
                page,
                pageCount,
                by: displayName,
              };
              applyVernMsg(msg);
              void publishVernMsg(room, msg);
            }}
          />
        </main>

        <div
          className="room-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Изменить ширину панели чата"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
        />

        <aside
          className={`room-col room-col--chat${mobileTab === 'chat' ? ' is-visible' : ''}`}
        >
          <RoomSidePanel
            roomId={roomId}
            displayName={displayName}
            localIdentity={localIdentity}
            roomCefr={roomCefr}
            connected={connected}
            lexicon={lexicon}
            boardFiles={boardFiles}
            chatBlocked={Boolean(restrictions[localIdentity]?.chatBlocked)}
            onSentinelKick={() => onForcedLeave('policy')}
            onAddLexicon={addLexiconCard}
            onFocusBoardFile={(id) => {
              setFocusShapeId(id);
              window.setTimeout(() => setFocusShapeId(null), 400);
            }}
          />
        </aside>
      </div>

      <ReportDialog
        open={reportOpen}
        roomId={roomId}
        peers={participants
          .filter((p) => !p.isLocal && p.identity !== localIdentity)
          .map((p) => {
            let clientId = '';
            try {
              clientId =
                (JSON.parse(p.metadata || '{}') as { client_id?: string })
                  .client_id || '';
            } catch {
              clientId = '';
            }
            return {
              identity: p.identity,
              clientId: clientId || undefined,
              label: resolveName(p),
            };
          })}
        initialTarget={reportTarget}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </div>
  );
}
