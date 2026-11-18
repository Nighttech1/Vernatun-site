import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRooms } from '../api/lounge';
import { Layout } from '../components/Layout';
import { CampusRulesModal } from '../components/CampusRulesModal';
import { openTermsOfService } from '../components/modals/TermsOfServiceModal';
import { openPrivacyPolicy } from '../components/modals/PrivacyPolicyModal';
import type { LoungeRoom } from '../types/lounge';
import { cefrBadgeClass, cefrLabel } from '../utils/cefr';
import { formatSessionBadge } from '../utils/sessionBadge';

function pickFeaturedRoom(rooms: LoungeRoom[]): LoungeRoom | undefined {
  if (rooms.length === 0) return undefined;
  return rooms.reduce((best, r) =>
    (r.online || 0) > (best.online || 0) ? r : best,
  );
}

function roomRemainingNow(room: LoungeRoom, nowSec: number): {
  active: boolean;
  remaining: number;
} {
  const duration = room.duration_sec || 5400;
  if (room.session_active && room.ends_at && room.ends_at > 0) {
    return {
      active: true,
      remaining: Math.max(0, room.ends_at - nowSec),
    };
  }
  if (room.session_active && typeof room.remaining_sec === 'number') {
    return { active: true, remaining: Math.max(0, room.remaining_sec) };
  }
  return { active: false, remaining: duration };
}

export function LobbyPage() {
  const [rooms, setRooms] = useState<LoungeRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    let cancelled = false;
    fetchRooms()
      .then((data) => {
        if (!cancelled) {
          setRooms(data.rooms || []);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || String(err));
          setLoading(false);
        }
      });
    const id = window.setInterval(() => {
      fetchRooms()
        .then((data) => {
          if (!cancelled) setRooms(data.rooms || []);
        })
        .catch(() => undefined);
    }, 12000);
    const tick = window.setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(tick);
    };
  }, []);

  const totalOnline = useMemo(
    () => rooms.reduce((sum, r) => sum + (r.online || 0), 0),
    [rooms],
  );

  const liveRoomCount = useMemo(
    () => rooms.filter((r) => (r.online || 0) > 0).length,
    [rooms],
  );

  const featuredRoom = useMemo(() => pickFeaturedRoom(rooms), [rooms]);
  const popularRoomId = featuredRoom?.id || '';

  return (
    <Layout>
      <main className="campus-main">
        <section className="campus-hero">
          <div className="campus-hero-grid">
            <div className="campus-hero-copy">
              <h1 className="campus-hero-title">Кампус</h1>
              <p className="campus-hero-subtitle">голосовые комнаты</p>
              <p className="campus-hero-lead">
                Ежедневная разговорная практика с носителями языка и
                единомышленниками. Выберите комнату и войдите в эфир.
              </p>
              {!loading && !error && rooms.length > 0 && (
                <div className="campus-stats-chip campus-stats-chip--under-lead">
                  <span>
                    ● {liveRoomCount}{' '}
                    {liveRoomCount % 10 === 1 && liveRoomCount % 100 !== 11
                      ? 'КОМНАТА'
                      : liveRoomCount % 10 >= 2 &&
                          liveRoomCount % 10 <= 4 &&
                          (liveRoomCount % 100 < 10 || liveRoomCount % 100 >= 20)
                        ? 'КОМНАТЫ'
                        : 'КОМНАТ'}{' '}
                    В ЭФИРЕ
                  </span>
                  <span>•</span>
                  <span>
                    {totalOnline}{' '}
                    {totalOnline % 10 === 1 && totalOnline % 100 !== 11
                      ? 'УЧАСТНИК'
                      : totalOnline % 10 >= 2 &&
                          totalOnline % 10 <= 4 &&
                          (totalOnline % 100 < 10 || totalOnline % 100 >= 20)
                        ? 'УЧАСТНИКА'
                        : 'УЧАСТНИКОВ'}{' '}
                    ОНЛАЙН
                  </span>
                </div>
              )}
              <div className="campus-hero-actions">
                <button
                  type="button"
                  className="campus-btn-secondary"
                  onClick={() => setRulesOpen(true)}
                >
                  Правила участия
                </button>
                <button
                  type="button"
                  className="campus-btn-secondary"
                  onClick={() => openTermsOfService()}
                >
                  Пользовательское соглашение
                </button>
                <button
                  type="button"
                  className="campus-btn-secondary"
                  onClick={() => openPrivacyPolicy()}
                >
                  Политика конфиденциальности
                </button>
              </div>
            </div>

            {featuredRoom && !loading && (
              <div className="campus-featured">
                <div className="campus-featured-card">
                  <div className="campus-featured-glow" aria-hidden />
                  <div className="campus-featured-live">
                    <div className="campus-featured-live-label">
                      <span
                        className={`campus-featured-live-dot${(featuredRoom.online || 0) > 0 ? ' is-on-air animate-live-dot' : ''}`}
                        aria-hidden
                      />
                      Популярное
                    </div>
                  </div>
                  <h3 className="campus-featured-title">{featuredRoom.title}</h3>
                  <p className="campus-featured-meta">
                    {(featuredRoom.online || 0) > 0
                      ? `${featuredRoom.online} участников онлайн`
                      : featuredRoom.description}
                  </p>
                  <Link
                    to={`/room?room=${encodeURIComponent(featuredRoom.id)}`}
                    className="campus-btn-on-azure text-white"
                    style={{ width: '100%' }}
                  >
                    Подключиться к обсуждению
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {loading && <p className="state-message is-muted">Загружаем список…</p>}
        {error && <p className="state-message is-error">{error}</p>}

        {!loading && !error && rooms.length === 0 && (
          <p className="state-message is-muted">Комнат пока нет.</p>
        )}

        {!loading && !error && rooms.length > 0 && (
          <section className="campus-grid">
            {rooms.map((room) => {
              const online = room.online || 0;
              const isLive = online > 0;
              const { active, remaining } = roomRemainingNow(room, nowSec);
              const timerLabel = formatSessionBadge(remaining, active);
              return (
                <article
                  key={room.id}
                  className={`campus-card${room.id === popularRoomId && isLive ? ' campus-card--popular' : ''}`}
                >
                  <div>
                    <div className="campus-card-header">
                      <span
                        className={`campus-live-badge${active || isLive ? ' is-live' : ' is-idle'}`}
                        title={
                          active
                            ? 'До конца текущей сессии'
                            : 'Длительность сессии после старта'
                        }
                      >
                        <span className="campus-live-badge-dot" />
                        ⏱ {timerLabel}
                      </span>
                      <span className={cefrBadgeClass(room.cefr)}>
                        {cefrLabel(room.cefr)}
                      </span>
                    </div>
                    <h2 className="campus-card-title">{room.title}</h2>
                    <p className="campus-card-desc">{room.description}</p>
                    <div className="campus-card-online">
                      <span aria-hidden>👥</span>
                      {online}{' '}
                      {online === 1 ? 'участник' : 'участников'}
                    </div>
                  </div>
                  <Link
                    to={`/room?room=${encodeURIComponent(room.id)}`}
                    className="campus-card-cta text-white"
                  >
                    Присоединиться к эфиру
                  </Link>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <CampusRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </Layout>
  );
}
