import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardConfirmModal } from './BoardConfirmModal';
import { clampToolbarPos } from './toolbarBounds';

type Props = {
  roomId: string;
  boardLocked: boolean;
  onToggleLock: () => void;
  onPurgeSelectedAuthor: () => void;
  onClearBoard: () => void;
  selectedAuthorLabel?: string;
};

type Pending = 'purge' | 'clear' | null;

function loadHostPos(roomId: string): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(
      `vernatun-wb-hostbar:${roomId || 'open'}`,
    );
    if (!raw) return { x: -1, y: -1 }; // centered via layout effect
    const p = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof p.x === 'number' && typeof p.y === 'number') {
      return { x: p.x, y: p.y };
    }
  } catch {
    /* ignore */
  }
  return { x: -1, y: -1 };
}

/**
 * C-253: host mod tools as a small horizontal island (like vertical tool dock),
 * draggable only inside the board viewport.
 */
export function HostBoardToolbar({
  roomId,
  boardLocked,
  onToggleLock,
  onPurgeSelectedAuthor,
  onClearBoard,
  selectedAuthorLabel,
}: Props) {
  const [pending, setPending] = useState<Pending>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => loadHostPos(roomId));
  const drag = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
  } | null>(null);

  useEffect(() => {
    setPos(loadHostPos(roomId));
  }, [roomId]);

  // Default: center top of board when no saved pos
  useEffect(() => {
    if (pos.x >= 0 && pos.y >= 0) return;
    const el = dockRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    const next = clampToolbarPos(
      parent.clientWidth / 2 - el.offsetWidth / 2,
      36,
      el,
      parent,
    );
    setPos(next);
  }, [pos.x, pos.y]);

  const persist = useCallback(
    (next: { x: number; y: number }) => {
      localStorage.setItem(
        `vernatun-wb-hostbar:${roomId || 'open'}`,
        JSON.stringify(next),
      );
    },
    [roomId],
  );

  const onDragStart = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const isGrip =
      Boolean(target.closest('.wb-toolbar-grip')) ||
      Boolean(target.closest('[data-drag-handle]'));
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
    const next = clampToolbarPos(
      drag.current.sx + (e.clientX - drag.current.ox),
      drag.current.sy + (e.clientY - drag.current.oy),
      el,
      parent,
    );
    setPos(next);
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
      const clamped =
        el && parent ? clampToolbarPos(p.x, p.y, el, parent) : p;
      persist(clamped);
      return clamped;
    });
  };

  // Keep in bounds on resize
  useEffect(() => {
    const onResize = () => {
      const el = dockRef.current;
      const parent = el?.offsetParent as HTMLElement | null;
      if (!el || !parent || pos.x < 0) return;
      setPos((p) => clampToolbarPos(p.x, p.y, el, parent));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pos.x]);

  const style =
    pos.x < 0
      ? { left: '50%', top: 36, transform: 'translateX(-50%)' as const }
      : { left: pos.x, top: pos.y, transform: 'none' as const };

  return (
    <>
      <div
        ref={dockRef}
        className="wb-toolbar-dock host-board-dock"
        role="toolbar"
        aria-label="Модерация доски"
        style={style}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="wb-toolbar-island host-board-island">
          <button
            type="button"
            className="wb-toolbar-grip host-board-grip"
            data-drag-handle
            title="Перетащить панель модерации"
            aria-label="Перетащить панель модерации"
            onPointerDown={onDragStart}
          >
            ⋮⋮
          </button>
          <button
            type="button"
            className={`wb-tool-btn wb-tool-btn--icon${boardLocked ? ' wb-tool-btn--active' : ''}`}
            onClick={() => onToggleLock()}
            aria-pressed={boardLocked}
            title={
              boardLocked
                ? 'Снова открыть доску для рисования'
                : 'Закрыть доску: только просмотр'
            }
            aria-label={boardLocked ? 'Просмотр' : 'Блок доски'}
          >
            {boardLocked ? '👁' : '🔒'}
          </button>
          <button
            type="button"
            className="wb-tool-btn wb-tool-btn--icon"
            onClick={() => setPending('purge')}
            disabled={!selectedAuthorLabel}
            title={
              selectedAuthorLabel
                ? `Стереть всё от ${selectedAuthorLabel}`
                : 'Сначала выберите фигуру нарушителя'
            }
            aria-label="Стереть автора"
          >
            ✎⌫
          </button>
          <button
            type="button"
            className="wb-tool-btn wb-tool-btn--icon host-board-tool-danger"
            onClick={() => setPending('clear')}
            title="Очистить всю доску"
            aria-label="Очистить доску"
          >
            🗑
          </button>
        </div>
      </div>

      <BoardConfirmModal
        open={pending === 'purge'}
        title="Стереть рисунки автора?"
        body={`Будут удалены все объекты на доске от «${selectedAuthorLabel || 'автора'}». Это действие для срочной модерации.`}
        confirmLabel="Стереть"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          setPending(null);
          onPurgeSelectedAuthor();
        }}
      />
      <BoardConfirmModal
        open={pending === 'clear'}
        title="Очистить всю доску?"
        body="Все рисунки и загрузки на холсте будут удалены для всех участников комнаты."
        confirmLabel="Очистить доску"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          setPending(null);
          onClearBoard();
        }}
      />
    </>
  );
}
