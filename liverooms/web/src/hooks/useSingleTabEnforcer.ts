import { useEffect, useRef, useState } from 'react';

type TabMsg =
  | { type: 'REQUEST_OWNERSHIP'; tabId: string }
  | { type: 'OWNERSHIP_CLAIMED'; tabId: string }
  | { type: 'TAB_CLOSED'; tabId: string };

const STORAGE_PREFIX = 'campus_tab_owner_';

function makeTabId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * C-169: one browser tab owns a room session for this origin.
 * Returns isDuplicateTab=true when another tab already claimed ownership.
 */
export function useSingleTabEnforcer(
  roomId: string,
  clientId: string,
): { isDuplicateTab: boolean } {
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);
  const tabIdRef = useRef(makeTabId());
  const isOwnerRef = useRef(false);
  const duplicateRef = useRef(false);

  useEffect(() => {
    if (!roomId || !clientId) {
      setIsDuplicateTab(false);
      return;
    }

    const tabId = tabIdRef.current;
    const channelName = `campus_tab_bus_${roomId}`;
    const storageKey = `${STORAGE_PREFIX}${roomId}`;
    let channel: BroadcastChannel | null = null;
    let disposed = false;

    const markDuplicate = () => {
      if (disposed) return;
      duplicateRef.current = true;
      isOwnerRef.current = false;
      setIsDuplicateTab(true);
    };

    const claimOwnership = () => {
      if (disposed || duplicateRef.current) return;
      isOwnerRef.current = true;
      duplicateRef.current = false;
      setIsDuplicateTab(false);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ tabId, clientId, ts: Date.now() }),
        );
      } catch {
        /* ignore */
      }
    };

    const onMessage = (raw: TabMsg) => {
      if (disposed || !raw || typeof raw !== 'object') return;
      if (raw.tabId === tabId) return;

      if (raw.type === 'REQUEST_OWNERSHIP') {
        if (isOwnerRef.current) {
          const reply: TabMsg = { type: 'OWNERSHIP_CLAIMED', tabId };
          try {
            channel?.postMessage(reply);
          } catch {
            /* ignore */
          }
          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                tabId,
                clientId,
                ts: Date.now(),
                ping: raw.tabId,
              }),
            );
          } catch {
            /* ignore */
          }
        }
        return;
      }

      if (raw.type === 'OWNERSHIP_CLAIMED') {
        markDuplicate();
        return;
      }

      if (raw.type === 'TAB_CLOSED') {
        if (!isOwnerRef.current && duplicateRef.current) {
          duplicateRef.current = false;
          claimOwnership();
          try {
            channel?.postMessage({
              type: 'OWNERSHIP_CLAIMED',
              tabId,
            } satisfies TabMsg);
          } catch {
            /* ignore */
          }
        }
      }
    };

    try {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (ev: MessageEvent<TabMsg>) => onMessage(ev.data);
    } catch {
      channel = null;
    }

    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== storageKey || !ev.newValue) return;
      try {
        const parsed = JSON.parse(ev.newValue) as {
          tabId?: string;
          ping?: string;
        };
        if (parsed.ping === tabId && parsed.tabId && parsed.tabId !== tabId) {
          markDuplicate();
          return;
        }
        if (
          parsed.tabId &&
          parsed.tabId !== tabId &&
          isOwnerRef.current === false &&
          !duplicateRef.current
        ) {
          // Concurrent claim during settle — lower tabId wins
          if (String(parsed.tabId) < tabId) {
            markDuplicate();
          }
        } else if (
          parsed.tabId &&
          parsed.tabId !== tabId &&
          !isOwnerRef.current
        ) {
          markDuplicate();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);

    // Ask existing owner; claim if no reply.
    try {
      channel?.postMessage({
        type: 'REQUEST_OWNERSHIP',
        tabId,
      } satisfies TabMsg);
    } catch {
      /* ignore */
    }

    // Stale localStorage from a previous page load must NOT block this tab.
    // Only a live BroadcastChannel OWNERSHIP_CLAIMED reply proves another tab.
    // For BC-less peers: storage ping — if owner answers via storage event, we
    // mark duplicate; otherwise settle steals the key.
    try {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const parsed = JSON.parse(existing) as { tabId?: string; ts?: number };
        if (
          parsed.tabId &&
          parsed.tabId !== tabId &&
          Date.now() - (parsed.ts || 0) < 120_000
        ) {
          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                tabId: parsed.tabId,
                clientId,
                ts: parsed.ts || Date.now(),
                ping: tabId,
              }),
            );
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    }

    const settleTimer = window.setTimeout(() => {
      if (disposed || duplicateRef.current) return;
      // No live owner replied via BroadcastChannel → this tab owns the room.
      claimOwnership();
    }, 250);

    return () => {
      disposed = true;
      window.clearTimeout(settleTimer);
      window.removeEventListener('storage', onStorage);
      if (isOwnerRef.current) {
        try {
          channel?.postMessage({ type: 'TAB_CLOSED', tabId } satisfies TabMsg);
        } catch {
          /* ignore */
        }
        try {
          const cur = localStorage.getItem(storageKey);
          if (cur) {
            const parsed = JSON.parse(cur) as { tabId?: string };
            if (parsed.tabId === tabId) localStorage.removeItem(storageKey);
          }
        } catch {
          /* ignore */
        }
      }
      try {
        channel?.close();
      } catch {
        /* ignore */
      }
    };
  }, [roomId, clientId]);

  return { isDuplicateTab };
}
