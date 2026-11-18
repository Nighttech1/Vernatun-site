import { useMemo, useState } from 'react';
import { ChatPanel } from './ChatPanel';
import type { BoardFileItem } from './whiteboard/utils/boardFiles';
import type { LexiconCard } from '../utils/roomDataChannel';
import { saveToLocalSrs } from '../utils/roomDataChannel';

type SideTab = 'chat' | 'lexicon' | 'files';
type LexSort = 'newest' | 'alpha' | 'author';
type LexFilter = 'all' | 'mine' | 'has-phonetic';

interface RoomSidePanelProps {
  roomId: string;
  displayName: string;
  localIdentity: string;
  roomCefr: string;
  connected: boolean;
  lexicon: LexiconCard[];
  boardFiles?: BoardFileItem[];
  chatBlocked?: boolean;
  onSentinelKick?: () => void;
  onFocusBoardFile?: (shapeId: string) => void;
  onAddLexicon?: (card: {
    hy: string;
    phonetic: string;
    ru: string;
  }) => void;
}

const KIND_LABEL: Record<BoardFileItem['kind'], string> = {
  image: 'Картинка',
  pdf: 'PDF',
  audio: 'Аудио',
};

export function RoomSidePanel({
  roomId,
  displayName,
  localIdentity,
  connected,
  lexicon,
  boardFiles = [],
  chatBlocked = false,
  onSentinelKick,
  onFocusBoardFile,
  onAddLexicon,
}: RoomSidePanelProps) {
  const [tab, setTab] = useState<SideTab>('chat');
  const [srsNote, setSrsNote] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LexSort>('newest');
  const [filter, setFilter] = useState<LexFilter>('all');
  const [hy, setHy] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [ru, setRu] = useState('');
  const [formError, setFormError] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = lexicon.slice();
    if (filter === 'mine') {
      list = list.filter((c) => c.by === displayName || c.by === localIdentity);
    } else if (filter === 'has-phonetic') {
      list = list.filter((c) => Boolean(c.phonetic?.trim()));
    }
    if (q) {
      list = list.filter((c) => {
        const hay = `${c.hy} ${c.phonetic} ${c.ru} ${c.by}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (sort === 'alpha') {
      list.sort((a, b) => a.hy.localeCompare(b.hy, 'hy'));
    } else if (sort === 'author') {
      list.sort((a, b) => a.by.localeCompare(b.by, 'ru') || a.hy.localeCompare(b.hy, 'hy'));
    }
    // newest: lexicon already newest-first from RoomConnected
    return list;
  }, [lexicon, query, sort, filter, displayName, localIdentity]);

  const submitCard = () => {
    const word = hy.trim();
    const ph = phonetic.trim();
    const tr = ru.trim();
    if (!word || !tr) {
      setFormError('Нужны слово/фраза и перевод');
      return;
    }
    if (!onAddLexicon) {
      setFormError('Нет связи с комнатой');
      return;
    }
    onAddLexicon({ hy: word, phonetic: ph, ru: tr });
    setHy('');
    setPhonetic('');
    setRu('');
    setFormError('');
    setSrsNote('Карточка добавлена в словарь комнаты');
  };

  return (
    <div className="room-side">
      <div className="room-side-tabs" role="tablist" aria-label="Панель комнаты">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={`room-side-tab${tab === 'chat' ? ' is-active' : ''}`}
          onClick={() => setTab('chat')}
        >
          Чат
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'lexicon'}
          className={`room-side-tab${tab === 'lexicon' ? ' is-active' : ''}`}
          onClick={() => setTab('lexicon')}
        >
          Словарь
          {lexicon.length > 0 ? ` (${lexicon.length})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'files'}
          className={`room-side-tab${tab === 'files' ? ' is-active' : ''}`}
          onClick={() => setTab('files')}
        >
          Файлы
          {boardFiles.length > 0 ? ` (${boardFiles.length})` : ''}
        </button>
      </div>

      {tab === 'chat' && (
        <ChatPanel
          roomId={roomId}
          displayName={displayName}
          localIdentity={localIdentity}
          connected={connected}
          compactHeader
          chatBlocked={chatBlocked}
          onSentinelKick={onSentinelKick}
        />
      )}
      {tab === 'lexicon' && (
        <div className="lexicon-panel">
          <div className="lexicon-toolbar" role="toolbar" aria-label="Словарь">
            <button
              type="button"
              className={`lexicon-tool-btn${searchOpen || query ? ' is-on' : ''}`}
              aria-pressed={searchOpen}
              onClick={() => {
                setSearchOpen((v) => !v);
                setSortOpen(false);
                setFilterOpen(false);
              }}
            >
              Поиск
            </button>
            <button
              type="button"
              className={`lexicon-tool-btn${sortOpen || sort !== 'newest' ? ' is-on' : ''}`}
              aria-pressed={sortOpen}
              onClick={() => {
                setSortOpen((v) => !v);
                setSearchOpen(false);
                setFilterOpen(false);
              }}
            >
              Сортировка
            </button>
            <button
              type="button"
              className={`lexicon-tool-btn${filterOpen || filter !== 'all' ? ' is-on' : ''}`}
              aria-pressed={filterOpen}
              onClick={() => {
                setFilterOpen((v) => !v);
                setSearchOpen(false);
                setSortOpen(false);
              }}
            >
              Фильтр
            </button>
          </div>

          {searchOpen && (
            <div className="lexicon-tool-panel">
              <input
                type="search"
                className="lexicon-search-input"
                placeholder="Найти слово, перевод…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {sortOpen && (
            <div className="lexicon-tool-panel lexicon-tool-choices" role="group">
              {(
                [
                  ['newest', 'Сначала новые'],
                  ['alpha', 'По алфавиту'],
                  ['author', 'По автору'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`lexicon-choice${sort === id ? ' is-active' : ''}`}
                  onClick={() => setSort(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {filterOpen && (
            <div className="lexicon-tool-panel lexicon-tool-choices" role="group">
              {(
                [
                  ['all', 'Все'],
                  ['mine', 'Мои'],
                  ['has-phonetic', 'С транскрипцией'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`lexicon-choice${filter === id ? ' is-active' : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <ul className="lexicon-list" aria-label="Карточки словаря">
            {visible.length === 0 ? (
              <li className="lexicon-empty">
                {lexicon.length === 0
                  ? 'Пока пусто — добавьте первую карточку ниже.'
                  : 'Ничего не найдено. Снимите фильтр или очистите поиск.'}
              </li>
            ) : (
              visible.map((card) => (
                <li key={card.id} className="lexicon-list-item">
                  <div className="lexicon-card-body">
                    <p className="lexicon-list-hy">{card.hy}</p>
                    {card.phonetic ? (
                      <p className="lexicon-list-phonetic">{card.phonetic}</p>
                    ) : null}
                    <p className="lexicon-list-ru">{card.ru}</p>
                    <p className="lexicon-list-meta">от {card.by}</p>
                  </div>
                  <button
                    type="button"
                    className="lexicon-list-srs"
                    onClick={() => {
                      saveToLocalSrs(card);
                      setSrsNote(`«${card.hy}» → локальный SRS`);
                    }}
                  >
                    SRS
                  </button>
                </li>
              ))
            )}
          </ul>

          <form
            className="lexicon-add-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitCard();
            }}
          >
            <p className="lexicon-add-title">Новая карточка</p>
            <label className="lexicon-field">
              <span>Слово / фраза</span>
              <input
                value={hy}
                onChange={(e) => setHy(e.target.value)}
                placeholder="օրինակ՝ բարև"
                maxLength={120}
                disabled={!connected}
              />
            </label>
            <label className="lexicon-field">
              <span>Транскрипция</span>
              <input
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="barev"
                maxLength={120}
                disabled={!connected}
              />
            </label>
            <label className="lexicon-field">
              <span>Перевод</span>
              <input
                value={ru}
                onChange={(e) => setRu(e.target.value)}
                placeholder="привет"
                maxLength={160}
                disabled={!connected}
              />
            </label>
            {formError ? <p className="lexicon-form-error">{formError}</p> : null}
            {srsNote ? <p className="lexicon-srs-note">{srsNote}</p> : null}
            <button
              type="submit"
              className="lexicon-add-btn"
              disabled={!connected || !hy.trim() || !ru.trim()}
            >
              Добавить
            </button>
          </form>
        </div>
      )}
      {tab === 'files' && (
        <div className="room-files-panel">
          <p className="room-side-stub-title">Файлы на доске</p>
          {boardFiles.length === 0 ? (
            <p className="room-side-stub-text">
              Загрузите картинку или аудио с панели слева на доске (файлы не
              больше 30 МБ) — файл появится здесь. На доске можно тянуть углы,
              чтобы менять размер.
            </p>
          ) : (
            <ul className="room-files-list">
              {boardFiles.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="room-files-item"
                    onClick={() => onFocusBoardFile?.(f.shapeId)}
                    title="Показать на доске"
                  >
                    <span className="room-files-kind">{KIND_LABEL[f.kind]}</span>
                    <span className="room-files-name">{f.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
