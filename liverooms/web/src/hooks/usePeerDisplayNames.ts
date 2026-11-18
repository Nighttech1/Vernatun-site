import { useCallback, useEffect, useState } from 'react';
import {
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent, type Participant } from 'livekit-client';
import {
  publishVernMsg,
  subscribeVernData,
  type VernMsg,
} from '../utils/roomDataChannel';

/**
 * C-233 / C-234: Live nick map + peer.hello / peer.roster.request.
 * Single source for ParticipantList and ReportDialog.
 */
export function usePeerDisplayNames(localDisplayName: string) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [nameById, setNameById] = useState<Record<string, string>>({});

  const publishHello = useCallback(() => {
    const name = (localDisplayName || localParticipant?.name || '').trim();
    if (!name) return;
    const msg: VernMsg = { type: 'peer.hello', name };
    void publishVernMsg(room, msg).catch(() => {
      /* best-effort */
    });
  }, [localDisplayName, localParticipant?.name, room]);

  // Seed from LiveKit participant names
  useEffect(() => {
    setNameById((prev) => {
      const next = { ...prev };
      for (const p of participants) {
        const n = (p.name || '').trim();
        if (n) next[p.identity] = n;
      }
      const localId = localParticipant?.identity;
      const localN = (localDisplayName || '').trim();
      if (localId && localN) next[localId] = localN;
      return next;
    });
  }, [participants, localDisplayName, localParticipant?.identity]);

  // LiveKit name / connect events
  useEffect(() => {
    const onName = (name: string, participant: Participant) => {
      const n = (name || participant.name || '').trim();
      if (!n) return;
      setNameById((prev) =>
        prev[participant.identity] === n
          ? prev
          : { ...prev, [participant.identity]: n },
      );
    };
    const onConnected = (participant: Participant) => {
      const n = (participant.name || '').trim();
      if (n) {
        setNameById((prev) =>
          prev[participant.identity] === n
            ? prev
            : { ...prev, [participant.identity]: n },
        );
      }
      // Late joiner: announce ourselves so they learn our nick
      publishHello();
    };
    room.on(RoomEvent.ParticipantNameChanged, onName);
    room.on(RoomEvent.ParticipantConnected, onConnected);
    return () => {
      room.off(RoomEvent.ParticipantNameChanged, onName);
      room.off(RoomEvent.ParticipantConnected, onConnected);
    };
  }, [room, publishHello]);

  // Mount: hello + roster request; handle peer.hello / peer.roster.request
  useEffect(() => {
    publishHello();
    const roster: VernMsg = {
      type: 'peer.roster.request',
      by: localDisplayName || localParticipant?.identity || '',
    };
    void publishVernMsg(room, roster).catch(() => {
      /* best-effort */
    });

    return subscribeVernData(room, {
      onMessage: (msg: VernMsg, from) => {
        if (msg.type === 'peer.roster.request') {
          publishHello();
          return;
        }
        if (msg.type === 'peer.hello' && from) {
          const n = (msg.name || '').trim();
          if (!n) return;
          setNameById((prev) =>
            prev[from.identity] === n
              ? prev
              : { ...prev, [from.identity]: n },
          );
          return;
        }
        // Legacy mid-session rename from older clients — still display
        if (msg.type === 'peer.rename' && from) {
          const n = (msg.name || '').trim();
          if (!n) return;
          setNameById((prev) =>
            prev[from.identity] === n
              ? prev
              : { ...prev, [from.identity]: n },
          );
        }
      },
    });
  }, [
    room,
    publishHello,
    localDisplayName,
    localParticipant?.identity,
  ]);

  const resolveName = useCallback(
    (p: Participant): string => {
      if (p.isLocal) {
        return (
          localDisplayName ||
          nameById[p.identity] ||
          p.name ||
          p.identity ||
          'участник'
        );
      }
      return nameById[p.identity] || p.name || p.identity || 'участник';
    },
    [localDisplayName, nameById],
  );

  return { nameById, resolveName, participants };
}
