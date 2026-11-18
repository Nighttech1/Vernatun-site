import { useEffect, useRef, useState } from 'react';
import { useEditor, useValue, type TLShapeId } from 'tldraw';

type Label = {
  id: string;
  nick: string;
  x: number;
  y: number;
};

const FLASH_MS = 1200;

/**
 * C-219: local-only author chips.
 * - Flash nick ~1.2s on local shape create
 * - Persistently show only for shapes selected in THIS editor
 * - Never broadcast label visibility (overlay is local)
 */
export function ShapeAuthorLabels() {
  const editor = useEditor();
  const [labels, setLabels] = useState<Label[]>([]);
  const flashUntil = useRef<Map<string, number>>(new Map());
  const [flashTick, setFlashTick] = useState(0);

  const tick = useValue(
    'author-labels-tick',
    () => {
      const ids = [...editor.getCurrentPageShapeIds()];
      const sel = editor.getSelectedShapeIds();
      const cam = editor.getCamera();
      return `${ids.length}:${sel.join(',')}:${cam.x.toFixed(0)}:${cam.y.toFixed(0)}:${cam.z.toFixed(2)}`;
    },
    [editor],
  );

  useEffect(() => {
    const unsub = editor.sideEffects.registerAfterCreateHandler(
      'shape',
      (shape) => {
        const meta = (shape.meta || {}) as Record<string, unknown>;
        const nick = String(meta.createdByNickname || '').trim();
        if (!nick) return;
        const id = String(shape.id);
        flashUntil.current.set(id, Date.now() + FLASH_MS);
        setFlashTick((n) => n + 1);
        window.setTimeout(() => {
          flashUntil.current.delete(id);
          setFlashTick((n) => n + 1);
        }, FLASH_MS + 40);
      },
    );
    return () => unsub();
  }, [editor]);

  useEffect(() => {
    const next: Label[] = [];
    const selected = new Set(editor.getSelectedShapeIds().map(String));
    const now = Date.now();
    const seen = new Set<string>();

    const pushLabel = (id: string) => {
      if (seen.has(id)) return;
      const shape = editor.getShape(id as TLShapeId);
      if (!shape) return;
      const meta = (shape.meta || {}) as Record<string, unknown>;
      const nick = String(meta.createdByNickname || '').trim();
      if (!nick) return;
      const bounds = editor.getShapePageBounds(id as TLShapeId);
      if (!bounds) return;
      const screen = editor.pageToViewport({
        x: bounds.x,
        y: bounds.y,
      });
      seen.add(id);
      next.push({
        id,
        nick,
        x: screen.x,
        y: Math.max(4, screen.y - 18),
      });
    };

    for (const id of selected) pushLabel(id);

    for (const [id, until] of flashUntil.current) {
      if (until <= now) {
        flashUntil.current.delete(id);
        continue;
      }
      pushLabel(id);
    }

    setLabels(next);
  }, [editor, tick, flashTick]);

  if (labels.length === 0) return null;

  return (
    <div className="shape-author-labels" aria-hidden>
      {labels.map((l) => (
        <span
          key={l.id}
          className="shape-author-chip is-selected"
          style={{ left: l.x, top: l.y }}
        >
          {l.nick}
        </span>
      ))}
    </div>
  );
}
