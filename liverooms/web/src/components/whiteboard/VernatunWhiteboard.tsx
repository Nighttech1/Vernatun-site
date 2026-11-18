import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Tldraw,
  type Editor,
  type TLComponents,
  type TLShape,
} from 'tldraw';
import type { Room } from 'livekit-client';
import 'tldraw/tldraw.css';
import '../../styles/board-tailwind.css';
import '../../styles/whiteboard.css';
import { getClientId } from '../../utils/clientId';
import { evaluateCanvasSafety } from '../../utils/nsfwScanner';
import { registerBoardCapturer } from '../../utils/boardCaptureRegistry';
import { useTldrawSentinel } from '../../services/moderation/useTldrawSentinel';
import {
  boardPersistenceKey,
  clearBoardPersistence,
  useLivekitTldrawSync,
} from '../../hooks/useLivekitTldrawSync';
import { CustomToolbar } from './CustomToolbar';
import { HostBoardToolbar } from './HostBoardToolbar';
import { ShapeAuthorLabels } from './ShapeAuthorLabels';
import { PdfPageNav } from './PdfPageNav';
import { AudioSnippetShapeUtil } from './shapes/AudioSnippetShape';
import { VocabCardShapeUtil } from './shapes/VocabCardShape';
import type { BoardFileItem } from './utils/boardFiles';
import type { BoardRole } from './utils/boardRoles';

const shapeUtils = [VocabCardShapeUtil, AudioSnippetShapeUtil];
const NSFW_DEBOUNCE_MS = 2500;

const GUEST_COLORS = [
  '#E11D48',
  '#2A5A84',
  '#C95B36',
  '#0F766E',
  '#7C3AED',
  '#B45309',
];

function colorForClient(clientId: string): string {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h + clientId.charCodeAt(i) * 17) % 997;
  return GUEST_COLORS[h % GUEST_COLORS.length];
}

const components: TLComponents = {
  Toolbar: null,
  PageMenu: null,
  MainMenu: null,
  StylePanel: null,
  NavigationPanel: null,
  HelpMenu: null,
  DebugMenu: null,
};

type Cam = { x: number; y: number; z: number };

type Props = {
  roomId: string;
  role: BoardRole;
  authorName: string;
  localIdentity?: string;
  livekitRoom?: Room | null;
  licenseKey?: string;
  onSummon?: (camera: Cam) => void;
  onPdfPageSync?: (page: number, pageCount: number) => void;
  remoteCamera?: Cam | null;
  remotePdfPage?: number | null;
  onFilesChange?: (files: BoardFileItem[]) => void;
  focusShapeId?: string | null;
  brushLocked?: boolean;
  boardReadOnly?: boolean;
  nsfwEnabled?: boolean;
  onNsfwViolation?: (detail: { scores: Record<string, number> }) => void;
  onSentinelKick?: () => void;
  onHostToggleBoardLock?: () => void;
  onHostClearBoard?: () => void;
  onHostPurgeAuthor?: (clientId: string, nickname: string) => void;
};

async function editorToCanvas(editor: Editor): Promise<HTMLCanvasElement | null> {
  try {
    const ids = [...editor.getCurrentPageShapeIds()];
    if (ids.length === 0) {
      const empty = document.createElement('canvas');
      empty.width = 224;
      empty.height = 224;
      return empty;
    }
    const exported = await editor.getSvgString(ids, {
      background: true,
      scale: 0.5,
    });
    const xml = exported?.svg;
    if (!xml) return null;
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.min(512, img.width || 224));
      canvas.height = Math.max(1, Math.min(512, img.height || 224));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    try {
      const el = document.querySelector(
        '.board-tldraw-stage canvas',
      ) as HTMLCanvasElement | null;
      return el;
    } catch {
      return null;
    }
  }
}

export function VernatunWhiteboard({
  roomId,
  role,
  authorName,
  localIdentity,
  livekitRoom = null,
  licenseKey,
  onSummon,
  onPdfPageSync,
  remoteCamera = null,
  remotePdfPage = null,
  onFilesChange,
  focusShapeId = null,
  brushLocked = false,
  boardReadOnly = false,
  nsfwEnabled = false,
  onNsfwViolation,
  onSentinelKick,
  onHostToggleBoardLock,
  onHostClearBoard,
  onHostPurgeAuthor,
}: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfCount, setPdfCount] = useState(0);
  const [files, setFiles] = useState<BoardFileItem[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<{
    clientId: string;
    nickname: string;
  } | null>(null);
  const debounceRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const clientId = getClientId();
  const effectiveRole: BoardRole =
    (brushLocked || boardReadOnly) && role !== 'host' ? 'listener' : role;

  useLivekitTldrawSync({
    room: livekitRoom,
    editor,
    roomId,
    localIdentity: localIdentity || authorName,
    enabled: Boolean(livekitRoom && roomId),
  });

  const toastModeration = useCallback((message: string) => {
    try {
      window.dispatchEvent(
        new CustomEvent('vernatun-toast', { detail: { message } }),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const { runForShapes } = useTldrawSentinel({
    editor,
    roomId,
    identity: localIdentity || authorName,
    clientId,
    enabled: !brushLocked && effectiveRole !== 'listener',
    onToast: toastModeration,
    onKick: onSentinelKick,
  });

  useEffect(() => {
    if (remotePdfPage != null && remotePdfPage > 0) {
      setPdfPage(remotePdfPage);
    }
  }, [remotePdfPage]);

  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  useEffect(() => {
    if (!editor || !focusShapeId) return;
    try {
      editor.select(focusShapeId as never);
      editor.zoomToSelection({ animation: { duration: 280 } });
    } catch {
      /* shape may be gone */
    }
  }, [editor, focusShapeId]);

  useEffect(() => {
    if (!editor) return;
    try {
      editor.updateInstanceState({
        isReadonly: boardReadOnly && role !== 'host',
      });
    } catch {
      /* ignore */
    }
    if (brushLocked || effectiveRole === 'listener' || (boardReadOnly && role !== 'host')) {
      try {
        editor.setCurrentTool('hand');
      } catch {
        /* ignore */
      }
    }
  }, [editor, brushLocked, effectiveRole, boardReadOnly, role]);

  useEffect(() => {
    if (!editor) return;
    const unsub = editor.store.listen(
      () => {
        const ids = editor.getSelectedShapeIds();
        if (ids.length === 0) {
          setSelectedAuthor(null);
          return;
        }
        const shape = editor.getShape(ids[0]) as TLShape | undefined;
        const meta = (shape?.meta || {}) as Record<string, unknown>;
        const cid = String(meta.createdByClientId || '');
        const nick = String(meta.createdByNickname || '');
        if (cid) setSelectedAuthor({ clientId: cid, nickname: nick || cid });
        else setSelectedAuthor(null);
      },
      { source: 'user', scope: 'session' },
    );
    return () => unsub();
  }, [editor]);

  const runNsfwScan = useCallback(async () => {
    if (!nsfwEnabled || !editor || scanningRef.current || brushLocked) return;
    if (effectiveRole === 'listener') return;
    scanningRef.current = true;
    try {
      const canvas = await editorToCanvas(editor);
      if (!canvas) return;
      const result = await evaluateCanvasSafety(canvas);
      if (result.isAllowed) return;
      // C-217: evidence → POST incident → delete; NO ban / brush lock from bot
      const recent = [...editor.getCurrentPageShapeIds()].slice(-3).map(String);
      await runForShapes({
        nsfwHit: true,
        nsfwScores: result.scores,
        shapeIds: recent,
        surface: 'canvas',
      });
      onNsfwViolation?.({ scores: result.scores });
    } finally {
      scanningRef.current = false;
    }
  }, [
    brushLocked,
    editor,
    effectiveRole,
    nsfwEnabled,
    onNsfwViolation,
    runForShapes,
  ]);

  const scheduleNsfwScan = useCallback(() => {
    if (!nsfwEnabled) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void runNsfwScan();
    }, NSFW_DEBOUNCE_MS);
  }, [nsfwEnabled, runNsfwScan]);

  useEffect(() => {
    if (!editor || !nsfwEnabled) return;

    const onPointerUp = () => scheduleNsfwScan();
    const unsubStore = editor.store.listen(
      () => {
        scheduleNsfwScan();
      },
      { source: 'user', scope: 'document' },
    );

    const root = editor.getContainer();
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('touchend', onPointerUp);

    const onRemoteRollback = () => {
      try {
        editor.undo();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('vernatun-canvas-rollback', onRemoteRollback);

    return () => {
      unsubStore();
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('vernatun-canvas-rollback', onRemoteRollback);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [editor, nsfwEnabled, scheduleNsfwScan]);

  // C-207: register on-demand capture (no continuous stroke logging)
  useEffect(() => {
    if (!editor) {
      registerBoardCapturer(null);
      return;
    }
    registerBoardCapturer(async () => {
      let pngB64: string | undefined;
      let jpegB64: string | undefined;
      try {
        const canvas = await editorToCanvas(editor);
        if (canvas) {
          const jpegUrl = canvas.toDataURL('image/jpeg', 0.55);
          jpegB64 = jpegUrl.split(',')[1] || undefined;
          const pngUrl = canvas.toDataURL('image/png');
          pngB64 = pngUrl.split(',')[1] || undefined;
        }
      } catch {
        /* ignore */
      }
      let boardStateJson: string | undefined;
      try {
        boardStateJson = JSON.stringify(editor.getSnapshot());
      } catch {
        boardStateJson = undefined;
      }
      return { pngB64, jpegB64, boardStateJson };
    });
    return () => registerBoardCapturer(null);
  }, [editor]);

  // C-206 remote clear / purge via custom events from RoomConnected
  useEffect(() => {
    if (!editor) return;
    const onClear = () => {
      try {
        const ids = [...editor.getCurrentPageShapeIds()];
        if (ids.length) editor.deleteShapes(ids);
      } catch {
        /* ignore */
      }
      void clearBoardPersistence(roomId);
    };
    const onPurge = (ev: Event) => {
      const cid = String((ev as CustomEvent).detail?.clientId || '');
      if (!cid) return;
      try {
        const ids = [...editor.getCurrentPageShapeIds()].filter((id) => {
          const s = editor.getShape(id) as TLShape | undefined;
          const meta = (s?.meta || {}) as Record<string, unknown>;
          return String(meta.createdByClientId || '') === cid;
        });
        if (ids.length) editor.deleteShapes(ids);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('vernatun-board-clear', onClear);
    window.addEventListener('vernatun-board-purge-author', onPurge);
    return () => {
      window.removeEventListener('vernatun-board-clear', onClear);
      window.removeEventListener('vernatun-board-purge-author', onPurge);
    };
  }, [editor, roomId]);

  const onMount = useCallback(
    (ed: Editor) => {
      setEditor(ed);
      try {
        (window as unknown as { __vernatunEditor?: Editor }).__vernatunEditor =
          ed;
      } catch {
        /* ignore */
      }
      try {
        ed.user.updateUserPreferences({
          id: clientId,
          name: authorName,
          color: colorForClient(clientId),
        });
      } catch {
        /* older tldraw API */
      }
      // C-205: immutable author meta on every shape
      ed.sideEffects.registerBeforeCreateHandler('shape', (shape) => {
        const meta = (shape.meta || {}) as Record<string, unknown>;
        if (meta.createdByClientId) return shape;
        return {
          ...shape,
          meta: {
            ...meta,
            createdByClientId: clientId,
            createdByNickname: authorName,
            createdAt: Date.now(),
          },
        };
      });
      if (effectiveRole === 'listener') ed.setCurrentTool('laser');
    },
    [authorName, clientId, effectiveRole],
  );

  useEffect(() => {
    if (!editor || !remoteCamera) return;
    editor.setCamera(remoteCamera, { animation: { duration: 450 } });
  }, [editor, remoteCamera]);

  const purgeSelected = () => {
    if (!selectedAuthor || !onHostPurgeAuthor) return;
    onHostPurgeAuthor(selectedAuthor.clientId, selectedAuthor.nickname);
  };

  const clearAll = () => {
    if (!onHostClearBoard) return;
    onHostClearBoard();
  };

  return (
    <div
      className={`board-tldraw-stage vernatun-wb${brushLocked ? ' is-brush-locked' : ''}${boardReadOnly && role !== 'host' ? ' is-board-readonly' : ''}`}
    >
      {brushLocked && (
        <div className="board-brush-lock-toast" role="status">
          Рисование ограничено на 2 минуты (модерация 18+)
        </div>
      )}
      <div className="board-tldraw-canvas-wrap">
      {/* C-253: host island floats on board (draggable, clamped to viewport) */}
      {role === 'host' && (
        <HostBoardToolbar
          roomId={roomId}
          boardLocked={boardReadOnly}
          onToggleLock={() => onHostToggleBoardLock?.()}
          onPurgeSelectedAuthor={purgeSelected}
          onClearBoard={clearAll}
          selectedAuthorLabel={selectedAuthor?.nickname}
        />
      )}
      <Tldraw
        persistenceKey={
          livekitRoom ? undefined : boardPersistenceKey(roomId || 'open')
        }
        hideUi
        licenseKey={licenseKey || undefined}
        shapeUtils={shapeUtils}
        components={components}
        onMount={onMount}
      >
        <CustomToolbar
          roomId={roomId}
          role={effectiveRole}
          authorName={authorName}
          onSummon={onSummon}
          onPdfMeta={(m) => {
            setPdfPage(m.page);
            setPdfCount(m.pageCount);
            onPdfPageSync?.(m.page, m.pageCount);
          }}
          onFileAdded={(f) => {
            setFiles((prev) => {
              if (prev.some((x) => x.id === f.id)) return prev;
              return [f, ...prev].slice(0, 60);
            });
          }}
        />
        <PdfPageNav
          role={effectiveRole}
          page={pdfPage}
          pageCount={pdfCount}
          remotePage={remotePdfPage}
          onPageChange={(p) => {
            setPdfPage(p);
            onPdfPageSync?.(p, pdfCount);
          }}
        />
        <ShapeAuthorLabels />
      </Tldraw>
      </div>
    </div>
  );
}
