import { useCallback } from 'react';
import { scanChatBeforeSend } from './engine';
import type { SentinelHit } from './types';

type Args = {
  roomId: string;
  identity: string;
  clientId: string;
  onToast?: (message: string) => void;
};

/**
 * Pre-send chat scan. On hit: POST incident, block message (do not send).
 * No ban / mute / trust.
 */
export function useChatSentinel({
  roomId,
  identity,
  clientId,
  onToast,
}: Args) {
  const scanOutgoing = useCallback(
    async (text: string): Promise<SentinelHit | null> => {
      const hit = await scanChatBeforeSend({
        roomId,
        identity,
        clientId,
        text,
        onToast,
      });
      return hit;
    },
    [clientId, identity, onToast, roomId],
  );

  return { scanOutgoing };
}
