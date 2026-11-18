import { useCallback, useEffect, useRef } from 'react';
import type { Editor, TLShape } from 'tldraw';
import { postSentinelEnforce } from '../../api/lounge';
import { runSentinelPipeline } from './engine';
import type { SentinelHit } from './types';

type Args = {
  editor: Editor | null;
  roomId: string;
  identity: string;
  clientId: string;
  enabled?: boolean;
  onToast?: (message: string) => void;
  /** C-240: after delete shapes on hit — kick via sentinel-enforce */
  onKick?: () => void;
};

const DEBOUNCE_MS = 900;

async function capturePng(editor: Editor): Promise<string | undefined> {
  try {
    const anyEd = editor as Editor & {
      exportToBlob?: (opts: {
        ids: string[];
        format: 'png';
        scale?: number;
      }) => Promise<Blob>;
    };
    const ids = [...editor.getCurrentPageShapeIds()];
    if (ids.length && typeof anyEd.exportToBlob === 'function') {
      const blob = await anyEd.exportToBlob({
        ids,
        format: 'png',
        scale: 0.4,
      });
      const buf = await blob.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.querySelector(
      '.board-tldraw-stage canvas',
    ) as HTMLCanvasElement | null;
    if (!el) return undefined;
    const url = el.toDataURL('image/png');
    return url.split(',')[1] || undefined;
  } catch {
    return undefined;
  }
}

function shapeText(shape: TLShape): string {
  const props = (shape.props || {}) as Record<string, unknown>;
  const chunks: string[] = [];
  for (const key of [
    'text',
    'name',
    'title',
    'wordHy',
    'translit',
    'translationRu',
  ]) {
    const v = props[key];
    if (typeof v === 'string' && v.trim()) chunks.push(v);
  }
  return chunks.join(' ').trim();
}

/**
 * Wire Campus Sentinels into tldraw: text/heuristic on shape commits + NSFW helper.
 * Evidence → POST → deleteShapes → sentinel-enforce kick.
 */
export function useTldrawSentinel({
  editor,
  roomId,
  identity,
  clientId,
  enabled = true,
  onToast,
  onKick,
}: Args) {
  const strokeTs = useRef<number[]>([]);
  const busy = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const onKickRef = useRef(onKick);
  onKickRef.current = onKick;

  const removeShapes = useCallback(
    (ids: string[]) => {
      if (!editor || !ids.length) return;
      try {
        editor.deleteShapes(ids as never);
      } catch {
        try {
          editor.undo();
        } catch {
          /* ignore */
        }
      }
    },
    [editor],
  );

  const enforceKick = useCallback(async () => {
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
    onKickRef.current?.();
  }, [clientId, identity, roomId]);

  const runForShapes = useCallback(
    async (opts: {
      text?: string;
      shapeIds?: string[];
      nsfwHit?: boolean;
      nsfwScores?: Record<string, number>;
      surface?: 'shape' | 'canvas';
    }): Promise<SentinelHit | null> => {
      if (!editor || !enabled || busy.current) return null;
      busy.current = true;
      try {
        const ids = opts.shapeIds?.filter(Boolean) || [];
        const hit = await runSentinelPipeline({
          roomId,
          identity,
          clientId,
          surface: opts.surface || 'shape',
          ctx: {
            text: opts.text,
            strokeTimestamps: strokeTs.current.slice(-40),
            nsfwHit: opts.nsfwHit,
            nsfwScores: opts.nsfwScores,
          },
          targetId: ids[0] || null,
          shapeIds: ids,
          captureEvidencePng: () => capturePng(editor),
          onRemoveContent: () => {
            if (ids.length) removeShapes(ids);
            else {
              try {
                editor.undo();
              } catch {
                /* ignore */
              }
            }
          },
          onToast,
        });
        if (hit) {
          await enforceKick();
        }
        return hit;
      } finally {
        busy.current = false;
      }
    },
    [
      clientId,
      editor,
      enabled,
      enforceKick,
      identity,
      onToast,
      removeShapes,
      roomId,
    ],
  );

  useEffect(() => {
    if (!editor || !enabled) return;

    const onPointerUp = () => {
      strokeTs.current.push(Date.now());
      if (strokeTs.current.length > 80) {
        strokeTs.current = strokeTs.current.slice(-60);
      }
    };

    const root = editor.getContainer();
    root.addEventListener('pointerup', onPointerUp);

    const schedule = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        void (async () => {
          const ids = [...editor.getCurrentPageShapeIds()].slice(-4);
          let text = '';
          for (const id of ids) {
            const s = editor.getShape(id);
            if (s) text += ` ${shapeText(s)}`;
          }
          text = text.trim();
          await runForShapes({
            text: text || undefined,
            shapeIds: ids.map(String),
            surface: 'shape',
          });
        })();
      }, DEBOUNCE_MS);
    };

    const unsub = editor.store.listen(schedule, {
      source: 'user',
      scope: 'document',
    });

    return () => {
      unsub();
      root.removeEventListener('pointerup', onPointerUp);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [editor, enabled, runForShapes]);

  return { runForShapes };
}
