import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DefaultColorStyle,
  DefaultSizeStyle,
  createShapeId,
  useEditor,
  useValue,
  type Editor,
  type TLDefaultColorStyle,
  type TLDefaultSizeStyle,
} from 'tldraw';
import {
  canSummon,
  canUseTool,
  type BoardRole,
  type BoardToolId,
} from './utils/boardRoles';
import type { BoardFileItem } from './utils/boardFiles';
import { clampToolbarPos } from './toolbarBounds';

const STAMPS = [
  { emoji: '🇦🇲', label: 'Армения' },
  { emoji: '❓', label: 'Не понял' },
  { emoji: '✋', label: 'Хочу сказать' },
  { emoji: '👏', label: 'Апрес' },
] as const;

/** C-221: max image/audio upload size for board. */
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

const DRAW_TOOLS = new Set<BoardToolId>(['draw', 'highlight', 'eraser']);

const COLORS: { id: TLDefaultColorStyle; hex: string; label: string }[] = [
  { id: 'black', hex: '#1d1d1d', label: 'Чёрный' },
  { id: 'grey', hex: '#9ca3af', label: 'Серый' },
  { id: 'red', hex: '#e03131', label: 'Красный' },
  { id: 'orange', hex: '#f76707', label: 'Оранжевый' },
  { id: 'yellow', hex: '#f59f00', label: 'Жёлтый' },
  { id: 'green', hex: '#2f9e44', label: 'Зелёный' },
  { id: 'blue', hex: '#1971c2', label: 'Синий' },
  { id: 'violet', hex: '#9c36b5', label: 'Фиолетовый' },
];

const SIZES: { id: TLDefaultSizeStyle; label: string }[] = [
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'xl', label: 'XL' },
];

const ICONS: Record<BoardToolId, string> = {
  select: '↖',
  laser: '◎',
  draw: '✎',
  highlight: '▮',
  eraser: '⌫',
  vocab: 'Ա',
  audio: '♫',
  note: '🗒',
  media: '🖼',
  stamp: '👏',
  summon: '◎→',
};

const TITLES: Record<BoardToolId, string> = {
  select: 'Выделение',
  laser: 'Лазерная указка',
  draw: 'Карандаш',
  highlight: 'Маркер-хайлайтер',
  eraser: 'Ластик',
  vocab: 'Карточка слова',
  audio: 'Аудио-реплика',
  note: 'Стикер мысли',
  media: 'Загрузить картинку (не больше 30 МБ)',
  stamp: 'Быстрые реакции',
  summon: 'Все ко мне (камера ведущего)',
};

type Props = {
  roomId: string;
  role: BoardRole;
  authorName: string;
  onSummon?: (camera: { x: number; y: number; z: number }) => void;
  onPdfMeta?: (meta: { page: number; pageCount: number }) => void;
  onFileAdded?: (file: BoardFileItem) => void;
};

function createAtCenter(
  editor: Editor,
  type: string,
  props: Record<string, unknown>,
) {
  const c = editor.getViewportPageBounds().center;
  const id = createShapeId();
  editor.createShape({
    id,
    type,
    x: c.x - ((props.w as number) || 120) / 2,
    y: c.y - ((props.h as number) || 80) / 2,
    props,
  });
  return id;
}

function loadPos(roomId: string): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(`vernatun-wb-toolbar:${roomId || 'open'}`);
    if (!raw) return { x: 16, y: 80 };
    const p = JSON.parse(raw) as { x?: number; y?: number };
    return {
      x: typeof p.x === 'number' ? p.x : 16,
      y: typeof p.y === 'number' ? p.y : 80,
    };
  } catch {
    return { x: 16, y: 80 };
  }
}

export function CustomToolbar({
  roomId,
  role,
  authorName,
  onSummon,
  onFileAdded,
}: Props) {
  const editor = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [stampsOpen, setStampsOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [pos, setPos] = useState(() => loadPos(roomId));
  const [isNarrow, setIsNarrow] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(
    null,
  );

  useEffect(() => {
    setPos(loadPos(roomId));
  }, [roomId]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const persist = useCallback(
    (next: { x: number; y: number }) => {
      localStorage.setItem(
        `vernatun-wb-toolbar:${roomId || 'open'}`,
        JSON.stringify(next),
      );
    },
    [roomId],
  );

  const onDragStart = (e: React.PointerEvent) => {
    if (isNarrow) return;
    const target = e.target as HTMLElement;
    const isGrip =
      Boolean(target.closest('.wb-toolbar-grip')) ||
      Boolean(target.closest('[data-drag-handle]'));
    // Tool buttons must not start a drag; the grip IS a button — allow it.
    if (target.closest('button') && !isGrip) return;
    e.preventDefault();
    const el = dockRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = { ox: e.clientX, oy: e.clientY, sx: pos.x, sy: pos.y };
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const el = dockRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    // C-253: keep vertical tool dock inside board viewport (measured size)
    setPos(
      clampToolbarPos(
        drag.current.sx + (e.clientX - drag.current.ox),
        drag.current.sy + (e.clientY - drag.current.oy),
        el,
        parent,
      ),
    );
  };

  const onDragEnd = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    try {
      dockRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setPos((p) => {
      const el = dockRef.current;
      const parent = el?.offsetParent as HTMLElement | null;
      const next =
        el && parent ? clampToolbarPos(p.x, p.y, el, parent) : p;
      persist(next);
      return next;
    });
  };

  // Re-clamp after load / window resize so bar cannot sit off-screen
  useEffect(() => {
    if (isNarrow) return;
    const reclamp = () => {
      const el = dockRef.current;
      const parent = el?.offsetParent as HTMLElement | null;
      if (!el || !parent) return;
      setPos((p) => clampToolbarPos(p.x, p.y, el, parent));
    };
    window.setTimeout(reclamp, 0);
    window.addEventListener('resize', reclamp);
    return () => window.removeEventListener('resize', reclamp);
  }, [isNarrow, roomId]);

  const current = useValue(
    'board-tool',
    () => editor.getCurrentToolId(),
    [editor],
  );

  const color = useValue(
    'board-next-color',
    () => editor.getStyleForNextShape(DefaultColorStyle),
    [editor],
  );
  const size = useValue(
    'board-next-size',
    () => editor.getStyleForNextShape(DefaultSizeStyle),
    [editor],
  );

  const drawToolActive =
    current === 'draw' || current === 'highlight' || current === 'eraser';

  useEffect(() => {
    if (!drawToolActive) setStyleOpen(false);
  }, [drawToolActive]);

  const openStyleSoon = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setStyleOpen(true), 120);
  };

  const closeStyleSoon = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setStyleOpen(false), 220);
  };

  const setColor = (value: TLDefaultColorStyle) => {
    editor.run(() => {
      editor.setStyleForNextShapes(DefaultColorStyle, value);
      const sel = editor.getSelectedShapeIds();
      if (sel.length) editor.setStyleForSelectedShapes(DefaultColorStyle, value);
    });
  };

  const setSize = (value: TLDefaultSizeStyle) => {
    editor.run(() => {
      editor.setStyleForNextShapes(DefaultSizeStyle, value);
      const sel = editor.getSelectedShapeIds();
      if (sel.length) editor.setStyleForSelectedShapes(DefaultSizeStyle, value);
    });
  };

  const runTool = (id: BoardToolId) => {
    if (!canUseTool(role, id)) return;
    if (
      id === 'select' ||
      id === 'laser' ||
      id === 'draw' ||
      id === 'highlight' ||
      id === 'eraser'
    ) {
      editor.setCurrentTool(id);
      if (DRAW_TOOLS.has(id)) setStyleOpen(true);
      return;
    }
    if (id === 'vocab') {
      createAtCenter(editor, 'vocab-card', {
        w: 240,
        h: 160,
        wordHy: 'Բարև',
        translit: 'barev',
        translationRu: 'привет',
        dialect: 'common',
        authorName,
      });
      editor.setCurrentTool('select');
      return;
    }
    if (id === 'note') {
      editor.setCurrentTool('note');
      return;
    }
    if (id === 'audio') {
      audioRef.current?.click();
      return;
    }
    if (id === 'media') {
      fileRef.current?.click();
      return;
    }
    if (id === 'stamp') {
      setStampsOpen((v) => !v);
      return;
    }
    if (id === 'summon' && canSummon(role) && onSummon) {
      const cam = editor.getCamera();
      onSummon({ x: cam.x, y: cam.y, z: cam.z });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canUseTool(role, 'media')) return;
    if (!file.type.startsWith('image/')) {
      window.alert('На доску можно загружать только изображения (JPG, PNG, WebP…).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      window.alert(
        'Файл слишком большой. Загружайте картинку не больше 30 МБ.',
      );
      return;
    }
    setUploadBusy(true);
    try {
      const before = new Set(editor.getCurrentPageShapeIds());
      await editor.putExternalContent({
        type: 'files',
        files: [file],
        point: editor.getViewportPageBounds().center,
      });
      const latest = [...editor.getCurrentPageShapes()]
        .reverse()
        .find((s) => s.type === 'image' && !before.has(s.id));
      if (latest) {
        onFileAdded?.({
          id: latest.id,
          name: file.name,
          kind: 'image',
          shapeId: latest.id,
          addedAt: Date.now(),
        });
      }
      editor.setCurrentTool('select');
    } catch (err) {
      console.error(err);
    } finally {
      setUploadBusy(false);
    }
  };

  const onAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canUseTool(role, 'audio')) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      window.alert('Аудиофайл слишком большой. Не больше 30 МБ.');
      return;
    }
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^.]+$/, '');
    const shapeId = createAtCenter(editor, 'audio-snippet', {
      w: 280,
      h: 100,
      audioUrl: url,
      title,
      duration: 0,
      authorName,
    });
    onFileAdded?.({
      id: shapeId,
      name: file.name,
      kind: 'audio',
      shapeId,
      addedAt: Date.now(),
    });
    editor.setCurrentTool('select');
  };

  const placeStamp = (emoji: string) => {
    if (!canUseTool(role, 'stamp')) return;
    const c = editor.getViewportPageBounds().center;
    editor.createShape({
      id: createShapeId(),
      type: 'geo',
      x: c.x - 40,
      y: c.y - 40,
      props: {
        geo: 'rectangle',
        w: 80,
        h: 80,
        color: 'black',
        labelColor: 'black',
        fill: 'semi',
        dash: 'draw',
        size: 'l',
        font: 'draw',
        align: 'middle',
        verticalAlign: 'middle',
        growY: 0,
        url: '',
        scale: 1,
        richText: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: emoji }],
            },
          ],
        },
      },
    } as never);
    setStampsOpen(false);
  };

  const tools: BoardToolId[] = [
    'select',
    'laser',
    'draw',
    'highlight',
    'eraser',
    'vocab',
    'audio',
    'note',
    'media',
    'stamp',
  ];
  if (canSummon(role)) tools.push('summon');

  return (
    <div
      ref={dockRef}
      className="wb-toolbar-dock wb-toolbar-dock--vertical"
      role="toolbar"
      aria-label="Тулбар доски Vernatun"
      style={
        isNarrow
          ? { left: 8, top: 'auto', right: 'auto', bottom: 12 }
          : { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
      }
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <div className="wb-toolbar-island wb-toolbar-island--vertical">
        <button
          type="button"
          className="wb-toolbar-grip"
          data-drag-handle
          title="Перетащить панель"
          aria-label="Перетащить панель инструментов"
          onPointerDown={onDragStart}
        >
          ⋮⋮
        </button>
        {tools.map((id) => {
          const allowed = canUseTool(role, id);
          const active = current === id || (id === 'stamp' && stampsOpen);
          const isDraw = DRAW_TOOLS.has(id);
          return (
            <button
              key={id}
              type="button"
              title={TITLES[id]}
              aria-label={TITLES[id]}
              disabled={!allowed || (id === 'media' && uploadBusy)}
              aria-pressed={active}
              className={
                active
                  ? 'wb-tool-btn wb-tool-btn--icon wb-tool-btn--active'
                  : allowed
                    ? 'wb-tool-btn wb-tool-btn--icon'
                    : 'wb-tool-btn wb-tool-btn--icon wb-tool-btn--disabled'
              }
              onClick={() => runTool(id)}
              onPointerEnter={() => {
                if (isDraw && allowed) openStyleSoon();
              }}
              onPointerLeave={() => {
                if (isDraw) closeStyleSoon();
              }}
              onFocus={() => {
                if (isDraw && allowed) setStyleOpen(true);
              }}
            >
              {id === 'media' && uploadBusy ? '…' : ICONS[id]}
            </button>
          );
        })}
        {stampsOpen && (
          <div className="wb-stamps-pop wb-stamps-pop--side">
            {STAMPS.map((s) => (
              <button
                key={s.emoji}
                type="button"
                title={s.label}
                className="wb-stamp-btn"
                onClick={() => placeStamp(s.emoji)}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        )}
        {styleOpen && drawToolActive && (
          <div
            className="wb-draw-style-pop"
            role="dialog"
            aria-label="Цвет и размер кисти"
            onPointerEnter={() => {
              if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
              setStyleOpen(true);
            }}
            onPointerLeave={closeStyleSoon}
          >
            <div className="wb-draw-style-row" aria-label="Цвет">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`wb-draw-color-swatch${color === c.id ? ' is-active' : ''}`}
                  style={{ background: c.hex }}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={color === c.id}
                  onClick={() => setColor(c.id)}
                />
              ))}
            </div>
            <div className="wb-draw-style-row" aria-label="Размер">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`wb-draw-size-btn${size === s.id ? ' is-active' : ''}`}
                  title={`Размер ${s.label}`}
                  aria-pressed={size === s.id}
                  onClick={() => setSize(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="wb-file-input"
        onChange={(e) => void onFile(e)}
      />
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        className="wb-file-input"
        onChange={(e) => void onAudioFile(e)}
      />
    </div>
  );
}
