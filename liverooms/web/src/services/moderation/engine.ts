import { politicSentinel } from './sentinels/politic.sentinel';
import { censorSentinel } from './sentinels/censor.sentinel';
import { nsfwSentinel } from './sentinels/nsfw.sentinel';
import { hateSentinel } from './sentinels/hate.sentinel';
import { shieldSentinel } from './sentinels/shield.sentinel';
import type {
  IncidentPayload,
  RunSentinelPipelineArgs,
  SentinelHit,
  SentinelMatchContext,
  SentinelScanner,
} from './types';

const SCANNERS: SentinelScanner[] = [
  nsfwSentinel,
  hateSentinel,
  politicSentinel,
  censorSentinel,
  shieldSentinel,
];

/** Scan all sentinels; first hit wins (priority: NSFW → hate → politic → tone → spam). */
export function scanSentinels(ctx: SentinelMatchContext): SentinelHit | null {
  for (const s of SCANNERS) {
    const hit = s.scan(ctx);
    if (hit) return hit;
  }
  return null;
}

export async function postIncident(payload: IncidentPayload): Promise<{
  ok: boolean;
  incident_id?: string;
}> {
  const res = await fetch('/api/lounge/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[SENTINEL-ENGINE] POST failed', res.status, text);
    return { ok: false };
  }
  try {
    return (await res.json()) as { ok: boolean; incident_id?: string };
  } catch {
    return { ok: true };
  }
}

/**
 * Evidence-First pipeline:
 * detect → capture evidence → POST incident → delete content.
 * NEVER ban / mute / trust.
 */
export async function runSentinelPipeline(
  args: RunSentinelPipelineArgs,
): Promise<SentinelHit | null> {
  const hit = scanSentinels(args.ctx);
  if (!hit) return null;

  console.info('[SENTINEL-ENGINE] hit', {
    sentinel: hit.sentinelId,
    rule: hit.rule,
    surface: args.surface,
    room: args.roomId,
  });

  let png: string | undefined;
  try {
    png = await args.captureEvidencePng?.();
  } catch (err) {
    console.warn('[SENTINEL-ENGINE] evidence capture failed', err);
  }

  const evidence = png
    ? { kind: 'png_b64' as const, payload: png }
    : {
        kind: 'text' as const,
        payload: (hit.snippet || args.ctx.text || '').slice(0, 2000),
      };

  const payload: IncidentPayload = {
    room: args.roomId,
    sentinel_id: hit.sentinelId,
    surface: args.surface,
    identity: args.identity,
    client_id: args.clientId,
    target_id: args.targetId ?? args.shapeIds?.[0] ?? null,
    snippet: hit.snippet.slice(0, 2000),
    evidence,
    matched: { rule: hit.rule, score: hit.score },
  };

  const posted = await postIncident(payload);
  if (!posted.ok) {
    console.warn('[SENTINEL-ENGINE] skip delete — POST not ok');
    return hit;
  }

  try {
    await args.onRemoveContent?.(hit);
  } catch (err) {
    console.warn('[SENTINEL-ENGINE] remove content failed', err);
  }

  args.onToast?.('Контент снят модерацией');
  console.info('[SENTINEL-ENGINE] content removed', {
    incident_id: posted.incident_id,
    sentinel: hit.sentinelId,
  });
  return hit;
}

/** Chat pre-send gate: returns hit if message must not be posted. */
export async function scanChatBeforeSend(args: {
  roomId: string;
  identity: string;
  clientId: string;
  text: string;
  onToast?: (message: string) => void;
}): Promise<SentinelHit | null> {
  return runSentinelPipeline({
    roomId: args.roomId,
    identity: args.identity,
    clientId: args.clientId,
    surface: 'chat',
    ctx: { text: args.text },
    targetId: null,
    onToast: args.onToast,
    // Chat: nothing to delete locally before send — block send on hit.
    onRemoveContent: undefined,
  });
}
