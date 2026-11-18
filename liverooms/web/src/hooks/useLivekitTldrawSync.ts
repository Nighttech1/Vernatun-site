import { useEffect, useRef } from 'react';
import type { Room } from 'livekit-client';
import type { Editor, TLRecord } from 'tldraw';
import {
  publishVernMsg,
  waitForDataPublisher,
  subscribeVernData,
  type VernMsg,
} from '../utils/roomDataChannel';

const CHUNK_MAX = 10 * 1024;
const DEBOUNCE_MS = 60;
const IDB_PREFIX = 'TLDRAW_DOCUMENT_v2';

export function boardPersistenceKey(roomId: string): string {
  return `vernatun-wb-${roomId || 'open'}`;
}

/** Wipe local tldraw IndexedDB for this room (best-effort). */
export async function clearBoardPersistence(roomId: string): Promise<void> {
  const key = boardPersistenceKey(roomId);
  const dbName = `${IDB_PREFIX}${key}`;
  try {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
      window.setTimeout(() => resolve(), 1500);
    });
  } catch {
    /* ignore */
  }
}

function chunkString(s: string, max: number): string[] {
  if (!s) return [''];
  const out: string[] = [];
  for (let i = 0; i < s.length; i += max) {
    out.push(s.slice(i, i + max));
  }
  return out;
}

function newSyncId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type SyncOpts = {
  room: Room | null | undefined;
  editor: Editor | null;
  roomId: string;
  localIdentity: string;
  enabled?: boolean;
};

type ShapePacket = {
  put: TLRecord[];
  remove: string[];
};

/**
 * C-241: LiveKit board sync without IndexedDB fighting merges.
 * Publishes shape/document records; late joiners request a snapshot.
 */
export function useLivekitTldrawSync({
  room,
  editor,
  roomId,
  localIdentity,
  enabled = true,
}: SyncOpts): void {
  const applyingRemote = useRef(false);
  const pending = useRef<ShapePacket>({ put: [], remove: [] });
  const debounceTimer = useRef<number | null>(null);
  const chunkBuffers = useRef<Map<string, { total: number; parts: string[]; mask: boolean[] }>>(
    new Map(),
  );
  const byRef = useRef(localIdentity);

  useEffect(() => {
    byRef.current = localIdentity;
  }, [localIdentity]);

  useEffect(() => {
    if (!enabled || !room || !editor || !roomId) return;

    const publishSafe = (msg: VernMsg) => {
      void publishVernMsg(room, msg).catch((err) => {
        console.warn('[board-sync] publish failed', msg.type, err);
      });
    };

    try {
      (window as unknown as { __vernatunLivekitRoom?: Room }).__vernatunLivekitRoom =
        room;
    } catch {
      /* ignore */
    }

    const takeChunk = (
      kind: string,
      syncId: string,
      index: number,
      total: number,
      data: string,
    ): string | null => {
      if (total < 1 || index < 0 || index >= total) return null;
      const key = `${kind}:${syncId}`;
      let buf = chunkBuffers.current.get(key);
      if (!buf || buf.total !== total) {
        buf = {
          total,
          parts: Array.from({ length: total }, () => ''),
          mask: Array.from({ length: total }, () => false),
        };
        chunkBuffers.current.set(key, buf);
      }
      buf.parts[index] = data;
      buf.mask[index] = true;
      if (!buf.mask.every(Boolean)) return null;
      chunkBuffers.current.delete(key);
      return buf.parts.join('');
    };

    const publishPacket = (type: 'board.sync.diff' | 'board.sync.snapshot', payload: unknown) => {
      try {
        const raw = JSON.stringify(payload);
        const chunks = chunkString(raw, CHUNK_MAX);
        const syncId = newSyncId();
        const by = byRef.current || localIdentity;
        chunks.forEach((data, index) => {
          publishSafe({
            type,
            syncId,
            index,
            total: chunks.length,
            data,
            by,
          });
        });
      } catch {
        /* ignore */
      }
    };

    const collectDocumentRecords = (): TLRecord[] => {
      const out: TLRecord[] = [];
      try {
        for (const rec of editor.store.allRecords()) {
          const t = (rec as { typeName?: string }).typeName;
          // Skip volatile instance/camera/presence — keep document truth
          if (
            t === 'instance' ||
            t === 'instance_page_state' ||
            t === 'instance_presence' ||
            t === 'camera' ||
            t === 'pointer'
          ) {
            continue;
          }
          out.push(rec);
        }
      } catch {
        /* ignore */
      }
      return out;
    };

    const sendSnapshot = () => {
      if (applyingRemote.current) return;
      publishPacket('board.sync.snapshot', { records: collectDocumentRecords() });
    };

    const flushPending = () => {
      if (applyingRemote.current) return;
      const packet = pending.current;
      pending.current = { put: [], remove: [] };
      if (!packet.put.length && !packet.remove.length) return;
      // Dedupe puts by id (last wins)
      const byId = new Map<string, TLRecord>();
      for (const r of packet.put) {
        byId.set(String((r as { id?: string }).id || ''), r);
      }
      byId.delete('');
      publishPacket('board.sync.diff', {
        put: [...byId.values()],
        remove: [...new Set(packet.remove)],
      });
    };

    const scheduleFlush = () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(() => {
        debounceTimer.current = null;
        flushPending();
      }, DEBOUNCE_MS);
    };

    const applyRecords = (put: TLRecord[], remove: string[]) => {
      applyingRemote.current = true;
      try {
        editor.store.mergeRemoteChanges(() => {
          if (remove.length) {
            editor.store.remove(remove as never);
          }
          if (put.length) {
            editor.store.put(put as never);
          }
        });
      } catch {
        /* ignore */
      } finally {
        applyingRemote.current = false;
      }
    };

    const applySnapshotPayload = (json: string) => {
      applyingRemote.current = true;
      try {
        const parsed = JSON.parse(json) as {
          records?: TLRecord[];
          // legacy full tldraw snapshot
          document?: unknown;
          session?: unknown;
        };
        if (Array.isArray(parsed.records)) {
          editor.store.mergeRemoteChanges(() => {
            // Replace document shapes: put all remote records
            editor.store.put(parsed.records as never);
          });
        } else {
          // Legacy path
          editor.store.mergeRemoteChanges(() => {
            editor.loadSnapshot(parsed as Parameters<Editor['loadSnapshot']>[0]);
          });
        }
      } catch {
        /* ignore */
      } finally {
        applyingRemote.current = false;
      }
    };

    const applyDiffPayload = (json: string) => {
      try {
        const parsed = JSON.parse(json) as ShapePacket & {
          added?: Record<string, TLRecord>;
          updated?: Record<string, [TLRecord, TLRecord]>;
          removed?: Record<string, TLRecord>;
        };
        if (Array.isArray(parsed.put) || Array.isArray(parsed.remove)) {
          applyRecords(parsed.put || [], parsed.remove || []);
          return;
        }
        // Legacy RecordsDiff
        const put: TLRecord[] = [];
        const remove: string[] = [];
        for (const rec of Object.values(parsed.added || {})) {
          if (rec) put.push(rec);
        }
        for (const pair of Object.values(parsed.updated || {})) {
          const to = Array.isArray(pair) ? pair[1] : pair;
          if (to) put.push(to as TLRecord);
        }
        for (const id of Object.keys(parsed.removed || {})) {
          remove.push(id);
        }
        applyRecords(put, remove);
      } catch {
        /* ignore */
      }
    };

    const handleIncoming = (msg: VernMsg, fromIdentity?: string) => {
      try {
        if (fromIdentity && fromIdentity === room.localParticipant.identity) {
          return;
        }
        if (msg.type === 'board.sync.request') {
          // Always answer — even empty so peer knows sync works; if we have shapes, send them
          window.setTimeout(() => sendSnapshot(), 50 + Math.random() * 150);
          return;
        }
        if (msg.type === 'board.sync.snapshot' || msg.type === 'board.sync.chunk') {
          const joined = takeChunk(
            'snapshot',
            msg.syncId,
            msg.index,
            msg.total,
            msg.data,
          );
          if (joined != null) applySnapshotPayload(joined);
          return;
        }
        if (msg.type === 'board.sync.diff') {
          const syncId = msg.syncId || 'diff';
          const index = msg.index ?? 0;
          const total = msg.total ?? 1;
          if (total <= 1) {
            applyDiffPayload(msg.data);
            return;
          }
          const joined = takeChunk('diff', syncId, index, total, msg.data);
          if (joined != null) applyDiffPayload(joined);
          return;
        }
        if (msg.type === 'board.clear') {
          applyingRemote.current = true;
          try {
            const ids = [...editor.getCurrentPageShapeIds()];
            if (ids.length) editor.deleteShapes(ids);
          } catch {
            /* ignore */
          } finally {
            applyingRemote.current = false;
          }
        }
      } catch {
        /* never crash room */
      }
    };

    let unsubStore: (() => void) | undefined;
    try {
      // Listen to all local document writes (user + programmatic createShape)
      unsubStore = editor.store.listen(
        (entry) => {
          if (applyingRemote.current) return;
          if (entry.source === 'remote') return;
          try {
            const changes = entry.changes;
            for (const rec of Object.values(changes.added || {})) {
              pending.current.put.push(rec as TLRecord);
            }
            for (const pair of Object.values(changes.updated || {})) {
              const to = Array.isArray(pair) ? pair[1] : pair;
              if (to) pending.current.put.push(to as TLRecord);
            }
            for (const id of Object.keys(changes.removed || {})) {
              pending.current.remove.push(id);
            }
            scheduleFlush();
          } catch {
            /* ignore */
          }
        },
        { scope: 'document' },
      );
    } catch {
      unsubStore = undefined;
    }

    const unsubData = subscribeVernData(room, {
      onMessage: (msg, participant) => {
        handleIncoming(msg, participant?.identity);
      },
    });

    // Join handshake only after data publisher is ready (see publishVernMsg gate)
    let cancelled = false;
    let t1 = 0;
    let t2 = 0;
    let heartbeat = 0;
    void (async () => {
      const ready = await waitForDataPublisher(room, 20000);
      if (cancelled || !ready) {
        if (!ready) console.warn('[board-sync] data publisher never ready');
        return;
      }
      publishSafe({
        type: 'board.sync.request',
        by: byRef.current || localIdentity,
      });
      t1 = window.setTimeout(() => {
        publishSafe({
          type: 'board.sync.request',
          by: byRef.current || localIdentity,
        });
        try {
          if ([...editor.getCurrentPageShapeIds()].length > 0) sendSnapshot();
        } catch {
          /* ignore */
        }
      }, 1200);
      heartbeat = window.setInterval(() => {
        try {
          if (applyingRemote.current) return;
          if ([...editor.getCurrentPageShapeIds()].length > 0) sendSnapshot();
        } catch {
          /* ignore */
        }
      }, 4000);
    })();

    try {
      (
        window as unknown as { __vernatunForceBoardSync?: () => void }
      ).__vernatunForceBoardSync = () => {
        flushPending();
        sendSnapshot();
      };
    } catch {
      /* ignore */
    }

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearInterval(heartbeat);
      unsubData();
      unsubStore?.();
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [enabled, room, editor, roomId, localIdentity]);
}
