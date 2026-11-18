import { VernatunWhiteboard } from './whiteboard/VernatunWhiteboard';
import type { BoardFileItem } from './whiteboard/utils/boardFiles';
import type { BoardRole } from './whiteboard/utils/boardRoles';
import type { Room } from 'livekit-client';

interface BoardPanelProps {
  roomId?: string;
  roomTitle: string;
  displayName?: string;
  localIdentity?: string;
  livekitRoom?: Room | null;
  statusMessage?: string;
  onExitToLobby?: () => void;
  boardRole?: BoardRole;
  onBoardSummon?: (camera: { x: number; y: number; z: number }) => void;
  onBoardPdfPage?: (page: number, pageCount: number) => void;
  remoteCamera?: { x: number; y: number; z: number } | null;
  remotePdfPage?: number | null;
  onBoardFilesChange?: (files: BoardFileItem[]) => void;
  focusShapeId?: string | null;
  brushLocked?: boolean;
  boardReadOnly?: boolean;
  nsfwEnabled?: boolean;
  onNsfwViolation?: (detail: { scores: Record<string, number> }) => void;
  onSentinelKick?: () => void;
  onHostToggleBoardLock?: () => void;
  onHostClearBoard?: () => void;
  onHostPurgeAuthor?: (clientId: string, nickname: string) => void;
}

export function BoardPanel({
  roomId = '',
  roomTitle,
  displayName,
  localIdentity,
  livekitRoom = null,
  onExitToLobby,
  boardRole = 'speaker',
  onBoardSummon,
  onBoardPdfPage,
  remoteCamera = null,
  remotePdfPage = null,
  onBoardFilesChange,
  focusShapeId = null,
  brushLocked = false,
  boardReadOnly = false,
  nsfwEnabled = false,
  onNsfwViolation,
  onSentinelKick,
  onHostToggleBoardLock,
  onHostClearBoard,
  onHostPurgeAuthor,
}: BoardPanelProps) {
  const licenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY as
    | string
    | undefined;

  return (
    <div className="board-tldraw-root">
      <div className="board-tldraw-chrome">
        <span className="board-brand">Кампус · доска</span>
        <span className="board-live-room">{roomTitle}</span>
        {onExitToLobby && (
          <button
            type="button"
            className="board-exit-link"
            onClick={onExitToLobby}
          >
            ← Комнаты
          </button>
        )}
      </div>

      <div className="board-canvas-stack">
        {/* C-242: flat orange label ON the board — no plate/strip */}
        <p className="board-guest-canvas-label" role="note">
          <span className="board-guest-canvas-title">
            Гостевой холст участников
          </span>
          {brushLocked ? (
            <span className="board-guest-canvas-note">
              {' '}
              · кисть временно ограничена (18+)
            </span>
          ) : null}
        </p>

        <VernatunWhiteboard
          roomId={roomId}
          role={boardRole}
          authorName={displayName || 'гость'}
          localIdentity={localIdentity}
          livekitRoom={livekitRoom}
          licenseKey={licenseKey}
          onSummon={onBoardSummon}
          onPdfPageSync={onBoardPdfPage}
          remoteCamera={remoteCamera}
          remotePdfPage={remotePdfPage}
          onFilesChange={onBoardFilesChange}
          focusShapeId={focusShapeId}
          brushLocked={brushLocked}
          boardReadOnly={boardReadOnly}
          nsfwEnabled={nsfwEnabled}
          onNsfwViolation={onNsfwViolation}
          onSentinelKick={onSentinelKick}
          onHostToggleBoardLock={onHostToggleBoardLock}
          onHostClearBoard={onHostClearBoard}
          onHostPurgeAuthor={onHostPurgeAuthor}
        />
      </div>
    </div>
  );
}
