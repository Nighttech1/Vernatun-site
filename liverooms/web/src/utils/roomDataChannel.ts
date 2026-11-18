import type { Room, RemoteParticipant } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

export const VERNATUN_DC_TOPIC = 'vernatun';

export type LexiconCard = {
  id: string;
  hy: string;
  phonetic: string;
  ru: string;
  tag?: string;
  by: string;
};

export type VernMsg =
  | { type: 'lexicon.add'; id: string; hy: string; phonetic: string; ru: string; tag?: string; by: string }
  | { type: 'timer.start'; endsAt: number; durationSec: number; by: string }
  | { type: 'timer.reset'; by: string }
  | { type: 'scenario.set'; templateId: string; by: string }
  | { type: 'peer.rename'; name: string }
  | { type: 'peer.hello'; name: string }
  | { type: 'peer.roster.request'; by: string }
  | { type: 'host.changed'; identity: string; by: string }
  | { type: 'board.summon'; x: number; y: number; z: number; by: string }
  | { type: 'board.pdf.page'; page: number; pageCount: number; by: string }
  | { type: 'board.lock'; locked: boolean; by: string }
  | { type: 'board.clear'; by: string }
  | { type: 'board.purgeAuthor'; clientId: string; by: string }
  | { type: 'board.sync.request'; by: string }
  | {
      type: 'board.sync.snapshot';
      syncId: string;
      index: number;
      total: number;
      data: string;
      by: string;
    }
  | {
      type: 'board.sync.chunk';
      syncId: string;
      index: number;
      total: number;
      data: string;
      by: string;
    }
  | {
      type: 'board.sync.diff';
      syncId?: string;
      index?: number;
      total?: number;
      data: string;
      by: string;
    }
  | {
      type: 'mod.restrict';
      targetIdentity: string;
      chatBlocked?: boolean;
      boardBlocked?: boolean;
      micMuted?: boolean;
      by: string;
    }
  | { type: 'canvas.rollback'; by: string; reason?: string };

export function encodeVernMsg(msg: VernMsg): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg));
}

export function decodeVernMsg(data: Uint8Array): VernMsg | null {
  try {
    const raw = JSON.parse(new TextDecoder().decode(data)) as VernMsg;
    if (!raw || typeof raw !== 'object' || !('type' in raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

/** Wait until LiveKit publisher ICE can carry data (avoids poisoning SDK promise). */
export async function waitForDataPublisher(
  room: Room,
  timeoutMs = 20000,
): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (room.state !== 'connected') {
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }
    try {
      const eng = (room as unknown as { engine?: { pcManager?: { publisher?: { isICEConnected?: boolean; getICEConnectionState?: () => string } } } }).engine;
      const pub = eng?.pcManager?.publisher;
      if (eng?.pcManager && pub) {
        const ice = pub.getICEConnectionState?.() || '';
        if (pub.isICEConnected || ice === 'connected' || ice === 'completed') {
          return true;
        }
      }
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

export async function publishVernMsg(room: Room, msg: VernMsg): Promise<void> {
  // Never publish before publisher PC exists — first failure caches a rejected
  // promise inside livekit-client and blocks all later data until reconnect.
  const ready = await waitForDataPublisher(room, 8000);
  if (!ready) {
    throw new Error('data_publisher_not_ready');
  }
  const encoded = new TextEncoder().encode(JSON.stringify(msg));
  const payload = new Uint8Array(encoded);
  await room.localParticipant.publishData(payload, {
    reliable: true,
    topic: VERNATUN_DC_TOPIC,
  });
}

type Handlers = {
  onMessage: (msg: VernMsg, from?: RemoteParticipant) => void;
};

/** Subscribe once; returns cleanup. */
export function subscribeVernData(room: Room, handlers: Handlers): () => void {
  const onData = (
    payload: Uint8Array,
    participant?: RemoteParticipant,
    _kind?: unknown,
    topic?: string,
  ) => {
    if (topic && topic !== VERNATUN_DC_TOPIC) return;
    const msg = decodeVernMsg(payload);
    if (!msg) return;
    handlers.onMessage(msg, participant);
  };

  room.on(RoomEvent.DataReceived, onData);
  return () => {
    room.off(RoomEvent.DataReceived, onData);
  };
}

const SRS_KEY = 'vernatun-srs-v1';

export function loadLocalSrs(): LexiconCard[] {
  try {
    const raw = localStorage.getItem(SRS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LexiconCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToLocalSrs(card: LexiconCard): void {
  const list = loadLocalSrs();
  if (list.some((c) => c.hy === card.hy && c.ru === card.ru)) return;
  list.unshift(card);
  localStorage.setItem(SRS_KEY, JSON.stringify(list.slice(0, 200)));
}
