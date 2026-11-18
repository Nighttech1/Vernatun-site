import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import {
  LoungeApiError,
  fetchRooms,
  fetchToken,
  postLegalConsent,
} from '../api/lounge';
import { LegalGateModal } from '../components/modals/LegalGateModal';
import { NameGateModal } from '../components/modals/NameGateModal';
import { RoomConnected } from '../components/RoomConnected';
import { useSingleTabEnforcer } from '../hooks/useSingleTabEnforcer';
import { getClientId } from '../utils/clientId';
import {
  clearLegalConsent,
  hasValidLegalConsent,
  writeLegalConsent,
} from '../utils/legalConsent';
import type { LeaveReason } from '../types/lounge';
import type { TokenResponse } from '../types/lounge';

type MobileTab = 'participants' | 'center' | 'chat';

/** C-196: survive React StrictMode remount — one in-flight token per room+client. */
const joinInflight = new Map<string, Promise<TokenResponse>>();

function joinKey(roomId: string, clientId: string, displayName: string) {
  return `${roomId}::${clientId}::${displayName}`;
}

export function RoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = (searchParams.get('room') || '').trim();
  const clientId = useMemo(() => getClientId(), []);
  const joinStarted = useRef(false);
  const sessionJoinedAt = useRef(0);
  const graceRejoin = useRef(0);
  const policyKickRef = useRef(false);

  const { isDuplicateTab } = useSingleTabEnforcer(roomId, clientId);

  const [roomTitle, setRoomTitle] = useState('');
  const [roomCefr, setRoomCefr] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [leaveReason, setLeaveReason] = useState<LeaveReason | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('center');
  const [roomLocked, setRoomLocked] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [legalNeeded, setLegalNeeded] = useState(
    () => !hasValidLegalConsent(clientId),
  );
  const [legalBusy, setLegalBusy] = useState(false);
  const [legalError, setLegalError] = useState('');
  const [nameNeeded, setNameNeeded] = useState(true);
  const [entryName, setEntryName] = useState('');
  const [nameError, setNameError] = useState('');
  const [session, setSession] = useState<{
    token: string;
    url: string;
    displayName: string;
    identity: string;
    isHost: boolean;
  } | null>(null);

  const shareUrl = useMemo(() => {
    if (!roomId) return '';
    return `${window.location.origin}/room?room=${encodeURIComponent(roomId)}`;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setStatus('Нет номера комнаты. Вернитесь в список и выберите комнату.');
      return;
    }
    document.title = 'Комната — Vernatun';

    let cancelled = false;
    fetchRooms()
      .then((data) => {
        if (cancelled) return;
        const match = (data.rooms || []).find((r) => r.id === roomId);
        const title = match?.title || roomId;
        setRoomTitle(title);
        setRoomCefr(match?.cefr || '');
        setRoomLocked(Boolean(match?.locked));
        document.title = `${title} — Vernatun`;
      })
      .catch(() => {
        if (!cancelled) setRoomTitle(roomId);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const join = useCallback(async () => {
    if (busy || session || !roomId || isDuplicateTab) return;
    if (legalNeeded || !hasValidLegalConsent(clientId)) {
      setLegalNeeded(true);
      return;
    }
    const chosen = entryName.trim();
    if (nameNeeded || chosen.length < 2) {
      setNameNeeded(true);
      return;
    }
    if (roomLocked && !roomPassword.trim()) {
      setJoinError('Эта комната с паролем — введите пароль.');
      setStatus('Нужен пароль комнаты');
      return;
    }
    setBusy(true);
    setJoinError('');
    setLeaveReason(null);
    setStatus('Подключаемся…');
    const key = joinKey(roomId, clientId, chosen);
    try {
      let pending = joinInflight.get(key);
      if (!pending) {
        pending = fetchToken(
          roomId,
          clientId,
          roomPassword.trim() || undefined,
          chosen,
        ).finally(() => {
          joinInflight.delete(key);
        });
        joinInflight.set(key, pending);
      }
      const data = await pending;
      if (data.room_title) setRoomTitle(data.room_title);
      setSession({
        token: data.token,
        url: data.url,
        displayName: data.display_name || chosen,
        identity: data.identity,
        isHost: Boolean(data.is_host),
      });
      sessionJoinedAt.current = Date.now();
      setStatus(
        typeof data.trust === 'number' ? `Trust Score: ${data.trust}` : '',
      );
    } catch (err) {
      if (
        err instanceof LoungeApiError &&
        err.code === 'legal_consent_required'
      ) {
        clearLegalConsent();
        setLegalNeeded(true);
        setLegalError(
          err.message ||
            'Подтвердите 18+ и согласие с правилами перед входом',
        );
        setStatus('Нужно подтверждение возраста и правил');
        setJoinError('');
        joinStarted.current = false;
        return;
      }
      if (err instanceof LoungeApiError && err.code === 'banned') {
        const friendly =
          err.message ||
          'Доступ к комнатам ограничен модерацией. Если это ошибка — напишите клубу через контакты на сайте.';
        setStatus(friendly);
        setJoinError(friendly);
        joinStarted.current = false;
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      const friendly =
        msg.includes('trust_too_low') || msg.includes('Trust')
          ? 'Вход закрыт: Academic Trust Score слишком низкий для этой комнаты.'
          : msg.includes('bad_password') || msg.includes('парол')
            ? 'Неверный пароль комнаты.'
            : msg.includes('banned')
              ? 'Доступ к комнатам ограничен модерацией.'
              : 'Ошибка: ' + msg;
      if (msg.includes('bad_password') || msg.includes('парол')) {
        setRoomLocked(true);
      }
      setStatus(friendly);
      setJoinError(friendly);
      joinStarted.current = false;
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    session,
    roomId,
    roomLocked,
    roomPassword,
    isDuplicateTab,
    legalNeeded,
    nameNeeded,
    entryName,
    clientId,
  ]);

  useEffect(() => {
    if (
      !roomId ||
      session ||
      joinStarted.current ||
      leaveReason ||
      isDuplicateTab ||
      legalNeeded ||
      nameNeeded
    ) {
      return;
    }
    joinStarted.current = true;
    void join();
  }, [
    roomId,
    session,
    join,
    leaveReason,
    isDuplicateTab,
    legalNeeded,
    nameNeeded,
  ]);

  const handleLegalConfirm = useCallback(
    async (flags: { isAdult: boolean; termsAccepted: boolean }) => {
      setLegalBusy(true);
      setLegalError('');
      try {
        const res = await postLegalConsent({
          clientId,
          roomId,
          isAdult: flags.isAdult,
          termsAccepted: flags.termsAccepted,
        });
        writeLegalConsent(clientId, res.consent_id);
        setLegalNeeded(false);
        setNameNeeded(true);
        joinStarted.current = false;
      } catch (err) {
        setLegalError(
          err instanceof Error ? err.message : 'Не удалось сохранить согласие',
        );
      } finally {
        setLegalBusy(false);
      }
    },
    [clientId, roomId],
  );

  const handleNameConfirm = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      setNameError('Укажите имя от 2 до 40 символов');
      return;
    }
    setNameError('');
    setEntryName(trimmed);
    setNameNeeded(false);
    policyKickRef.current = false;
    joinStarted.current = false;
  }, []);

  const handleLeave = useCallback(() => {
    setSession(null);
    setLeaveReason(null);
    setStatus('');
    setMobileTab('center');
    joinStarted.current = false;
    setNameNeeded(true);
  }, []);

  const handleForcedLeave = useCallback(
    (reason: LeaveReason) => {
      // C-240: LiveKit PARTICIPANT_REMOVED after sentinel-enforce must not
      // overwrite policy UI or trigger C-196 grace rejoin.
      if (policyKickRef.current && reason === 'kicked') {
        setSession(null);
        setLeaveReason('policy');
        setMobileTab('center');
        joinStarted.current = false;
        setNameNeeded(true);
        return;
      }
      // C-196: first seconds after join — SESSION_OVERRIDE/race looks like kick.
      // One silent rejoin instead of scare screen. C-240 policy kicks skip grace.
      const ageMs = Date.now() - (sessionJoinedAt.current || 0);
      if (
        (reason === 'kicked' || reason === 'superseded') &&
        ageMs < 6000 &&
        graceRejoin.current < 1
      ) {
        graceRejoin.current += 1;
        setSession(null);
        setLeaveReason(null);
        setStatus('Переподключаемся…');
        joinStarted.current = false;
        window.setTimeout(() => {
          void join();
        }, 200);
        return;
      }
      setSession(null);
      setLeaveReason(reason);
      setMobileTab('center');
      joinStarted.current = false;
      if (reason === 'kicked') {
        setStatus('Вас исключили из комнаты.');
        setNameNeeded(true);
      } else if (reason === 'policy') {
        policyKickRef.current = true;
        graceRejoin.current = 99;
        setStatus('Выход из комнаты: нарушение правил модерации.');
        setNameNeeded(true);
      } else if (reason === 'superseded') {
        setStatus(
          'Сессия продолжена в другой вкладке или на другом устройстве.',
        );
      } else if (reason === 'ended') {
        setStatus('Комната завершена.');
      }
    },
    [join],
  );

  // If we become duplicate while connected — drop session immediately.
  useEffect(() => {
    if (isDuplicateTab && session) {
      setSession(null);
      setLeaveReason(null);
      setStatus('');
      joinStarted.current = false;
    }
  }, [isDuplicateTab, session]);

  const handleRoomError = useCallback((err: Error) => {
    setStatus('Ошибка: ' + (err.message || String(err)));
    setJoinError('Ошибка: ' + (err.message || String(err)));
    setSession(null);
    setLeaveReason('error');
    joinStarted.current = false;
  }, []);

  const exitToLobby = useCallback(() => {
    setSession(null);
    setLeaveReason(null);
    setJoinError('');
    setStatus('');
    joinStarted.current = false;
    navigate('/campus');
  }, [navigate]);

  const retryJoin = () => {
    joinStarted.current = false;
    setJoinError('');
    setLeaveReason(null);
    if (!entryName.trim()) {
      setNameNeeded(true);
      return;
    }
    void join();
  };

  if (isDuplicateTab) {
    return (
      <div className="tab-block-backdrop" role="alertdialog" aria-modal="true">
        <div className="tab-block-card">
          <p className="tab-block-eyebrow">Кампус</p>
          <h1 className="tab-block-title">Комната уже открыта</h1>
          <p className="tab-block-text">
            Комната «Кампус» уже открыта в другой вкладке. Использование
            платформы в нескольких вкладках одновременно запрещено.
          </p>
          <button
            type="button"
            className="campus-btn-primary"
            onClick={exitToLobby}
          >
            ← Все комнаты
          </button>
        </div>
      </div>
    );
  }

  if (legalNeeded && !session) {
    return (
      <LegalGateModal
        open
        roomTitle={roomTitle || roomId}
        busy={legalBusy}
        error={legalError}
        onConfirm={(flags) => void handleLegalConfirm(flags)}
      />
    );
  }

  if (nameNeeded && !session) {
    return (
      <NameGateModal
        open
        roomTitle={roomTitle || roomId}
        busy={busy}
        error={nameError}
        onConfirm={handleNameConfirm}
      />
    );
  }

  if (
    leaveReason === 'kicked' ||
    leaveReason === 'policy' ||
    leaveReason === 'ended' ||
    leaveReason === 'superseded'
  ) {
    const titles: Record<string, string> = {
      kicked: 'Вас исключили из комнаты',
      policy: 'Нарушение правил',
      ended: 'Комната завершена',
      superseded: 'Сессия перенесена',
    };
    const texts: Record<string, string> = {
      kicked:
        'Ведущий снял вас с эфира. Можно выбрать другую комнату или зайти снова позже.',
      policy:
        'Сообщение или действие на доске нарушило правила Кампуса. Вы выведены из комнаты. Можно выбрать другую комнату позже.',
      ended: 'Сессия закрыта. Вернитесь в список комнат Кампуса.',
      superseded:
        'Вы вошли в эту комнату с другого устройства или вкладки. Здесь соединение закрыто — продолжайте там, где активна сессия.',
    };
    return (
      <div className="room-app room-lifecycle">
        <div className="room-lifecycle-card">
          <p className="room-lifecycle-eyebrow">Кампус</p>
          <h1 className="room-lifecycle-title">{titles[leaveReason]}</h1>
          <p className="room-lifecycle-text">{texts[leaveReason]}</p>
          <button
            type="button"
            className="campus-btn-primary"
            onClick={exitToLobby}
          >
            ← Все комнаты
          </button>
          {(leaveReason === 'kicked' ||
            leaveReason === 'policy' ||
            leaveReason === 'superseded') && (
            <button
              type="button"
              className="campus-btn-secondary"
              onClick={retryJoin}
              style={{ marginTop: '0.75rem' }}
            >
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    // C-241: never mount a local-only tldraw board — it looks "live" but cannot sync.
    return (
      <div className="room-app room-lifecycle">
        <div className="room-lifecycle-card">
          <p className="room-lifecycle-eyebrow">Кампус</p>
          <h1 className="room-lifecycle-title">
            {joinError ? 'Не удалось войти' : 'Подключение к комнате…'}
          </h1>
          <p className="room-lifecycle-text">
            {joinError ||
              status ||
              'Ждём ответ сервера комнат. Доска откроется после подключения к эфиру.'}
          </p>
          {roomLocked && (
            <label className="room-password-field" style={{ marginBottom: '0.75rem' }}>
              <span>Пароль комнаты</span>
              <input
                type="password"
                value={roomPassword}
                autoComplete="current-password"
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Введите пароль"
              />
            </label>
          )}
          <button
            type="button"
            className="campus-btn-primary"
            onClick={retryJoin}
            disabled={busy || !roomId}
          >
            {busy ? 'Подключение…' : joinError || roomLocked ? 'Войти' : 'Повторить'}
          </button>
          <button
            type="button"
            className="campus-btn-secondary"
            onClick={exitToLobby}
            style={{ marginTop: '0.75rem' }}
          >
            ← Все комнаты
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-app">
      <LiveKitRoom
        className="room-session"
        token={session.token}
        serverUrl={session.url}
        connect
        audio={false}
        video={false}
        onError={handleRoomError}
        onDisconnected={() => {
          /* detailed reason handled inside RoomConnected */
        }}
      >
        <RoomConnected
          roomId={roomId}
          roomTitle={roomTitle || roomId}
          roomCefr={roomCefr}
          displayName={session.displayName}
          localIdentity={session.identity}
          isHost={session.isHost}
          shareUrl={shareUrl}
          mobileTab={mobileTab}
          onMobileTabChange={setMobileTab}
          onLeave={handleLeave}
          onForcedLeave={handleForcedLeave}
          onExitToLobby={exitToLobby}
          onStatusChange={setStatus}
          statusMessage={status}
        />
      </LiveKitRoom>
    </div>
  );
}
