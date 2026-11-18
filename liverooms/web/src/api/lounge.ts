import type {
  AiCoachResponse,
  AiConsentResponse,
  AiSttResponse,
  ChatGetResponse,
  ChatMessage,
  ChatPostResponse,
  LoungeRestrictions,
  RoomsResponse,
  TokenResponse,
} from '../types/lounge';

export class LoungeApiError extends Error {
  status: number;
  code: string;
  body: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    hint: string,
    body: Record<string, unknown> = {},
  ) {
    super(hint || code || `HTTP ${status}`);
    this.name = 'LoungeApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & {
    error?: string;
    hint?: string;
    code?: string;
  };
  if (!res.ok) {
    const code = String(data.error || data.code || `HTTP_${res.status}`);
    throw new LoungeApiError(
      res.status,
      code,
      String(data.hint || data.error || `HTTP ${res.status}`),
      data as Record<string, unknown>,
    );
  }
  return data;
}

/** Soft parse for AI stubs: 200 + ok:false is normal degrade, not throw. */
async function parseAiJson<T extends { ok?: boolean; hint?: string; error?: string }>(
  res: Response,
): Promise<T> {
  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    return {
      ok: false,
      degraded: true,
      error: 'bad_json',
      hint: 'Разбор временно недоступен',
    } as unknown as T;
  }
  if (!res.ok && res.status >= 500) {
    return {
      ...data,
      ok: false,
      degraded: true,
      hint: data.hint || 'Разбор временно недоступен',
    };
  }
  return data;
}

export async function fetchRooms(): Promise<RoomsResponse> {
  const res = await fetch('/api/lounge/rooms');
  return parseJson<RoomsResponse>(res);
}

export async function fetchToken(
  roomId: string,
  clientId?: string,
  password?: string,
  displayName?: string,
): Promise<TokenResponse> {
  const q = new URLSearchParams({ room: roomId });
  if (clientId) q.set('client_id', clientId);
  if (password) q.set('password', password);
  if (displayName) q.set('display_name', displayName);
  const res = await fetch(`/api/lounge/token?${q.toString()}`);
  return parseJson<TokenResponse>(res);
}

export async function fetchChat(roomId: string): Promise<ChatGetResponse> {
  const res = await fetch(
    `/api/lounge/chat?room=${encodeURIComponent(roomId)}`,
  );
  return parseJson<ChatGetResponse>(res);
}

export type SessionStatus = {
  ok: boolean;
  active: boolean;
  id?: string;
  startedAt?: number;
  endsAt?: number;
  remainingSec: number;
  durationSec: number;
  ended?: boolean;
  reason?: string;
};

export async function fetchSession(roomId: string): Promise<SessionStatus> {
  const res = await fetch(
    `/api/lounge/session?room=${encodeURIComponent(roomId)}`,
  );
  return parseJson<SessionStatus>(res);
}

/** C-255: notify API that this identity left — ends session if room empty. */
export async function postSessionVacate(
  roomId: string,
  identity?: string,
  opts?: { forceEmpty?: boolean },
): Promise<{ ok: boolean; ended?: boolean; online?: number }> {
  try {
    const res = await fetch('/api/lounge/session/vacate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: roomId,
        identity: identity || '',
        force_empty: Boolean(opts?.forceEmpty),
      }),
      keepalive: true,
    });
    return parseJson(res);
  } catch {
    return { ok: false };
  }
}

export async function postChat(
  roomId: string,
  name: string,
  text: string,
  clientId?: string,
  identity?: string,
): Promise<ChatMessage & { censored?: boolean }> {
  const res = await fetch('/api/lounge/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: roomId,
      name,
      text,
      client_id: clientId || '',
      identity: identity || '',
    }),
  });
  const data = await parseJson<ChatPostResponse>(res);
  return { ...data.message, censored: Boolean(data.censored) };
}

/** C-240: client self-kick after confirmed sentinel / owner-pattern hit. */
export async function postSentinelEnforce(params: {
  room: string;
  identity: string;
  clientId: string;
  action?: 'kick';
}): Promise<{ ok: boolean; action?: string; identity?: string }> {
  const res = await fetch('/api/lounge/sentinel-enforce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: params.room,
      identity: params.identity,
      client_id: params.clientId,
      action: params.action || 'kick',
    }),
  });
  return parseJson(res);
}

/** C-243: current host transfers moderator rights. */
export async function postHostTransfer(params: {
  room: string;
  fromIdentity: string;
  toIdentity: string;
}): Promise<{ ok: boolean; host_identity?: string }> {
  const res = await fetch('/api/lounge/host/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: params.room,
      from_identity: params.fromIdentity,
      to_identity: params.toIdentity,
    }),
  });
  return parseJson(res);
}

/** C-243: promote earliest peer if room lost its host. */
export async function postHostEnsure(
  room: string,
): Promise<{ ok: boolean; host_identity?: string; unchanged?: boolean }> {
  const res = await fetch('/api/lounge/host/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room }),
  });
  return parseJson(res);
}

export async function postLegalConsent(params: {
  clientId: string;
  roomId?: string;
  isAdult: boolean;
  termsAccepted: boolean;
}): Promise<{ ok: boolean; consent_id: string; session_id?: string }> {
  const res = await fetch('/api/lounge/legal/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: params.clientId,
      room_id: params.roomId || '',
      is_adult: params.isAdult,
      terms_accepted: params.termsAccepted,
    }),
  });
  return parseJson(res);
}

export async function postCanvasViolation(params: {
  room: string;
  clientId: string;
  identity?: string;
  scores?: Record<string, number>;
  strokeId?: string;
}): Promise<{ ok: boolean }> {
  const res = await fetch('/api/lounge/moderation/canvas-violation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: params.room,
      client_id: params.clientId,
      identity: params.identity || '',
      scores: params.scores || {},
      stroke_id: params.strokeId || '',
    }),
  });
  return parseJson(res);
}

export async function fetchRestrictions(
  roomId: string,
  clientId: string,
): Promise<{
  ok: boolean;
  restrictions: LoungeRestrictions | null;
}> {
  const q = new URLSearchParams({ room: roomId, client_id: clientId });
  const res = await fetch(`/api/lounge/restrictions?${q.toString()}`);
  return parseJson(res);
}

export async function fetchBoard(
  roomId: string,
  nickname?: string,
): Promise<{ ok?: boolean; url: string; storage_hint?: string }> {
  const q = new URLSearchParams({ room: roomId });
  if (nickname) q.set('nickname', nickname);
  const res = await fetch(`/api/lounge/board?${q.toString()}`);
  return parseJson(res);
}

export async function translateForLexicon(text: string): Promise<{
  ok?: boolean;
  hy: string;
  phonetic: string;
  ru: string;
  degraded?: boolean;
}> {
  try {
    const res = await fetch('/api/lounge/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await parseAiJson<{
      ok?: boolean;
      hy?: string;
      phonetic?: string;
      ru?: string;
      source?: string;
      degraded?: boolean;
    }>(res);
    const src = data.hy || data.source || text;
    return {
      ok: data.ok,
      hy: src,
      phonetic: data.phonetic || src.slice(0, 80),
      ru: data.ru || `перевод: ${src.slice(0, 120)}`,
      degraded: data.degraded,
    };
  } catch {
    return {
      ok: false,
      hy: text,
      phonetic: text.slice(0, 80),
      ru: `перевод: ${text.slice(0, 120)}`,
      degraded: true,
    };
  }
}

export async function postModeration(params: {
  room: string;
  action: 'mute' | 'kick' | 'escalate';
  targetIdentity: string;
  requesterIdentity: string;
  targetClientId?: string;
  reason?: string;
}): Promise<{ ok: boolean; message?: string; target_trust?: number | null }> {
  const res = await fetch('/api/lounge/moderation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: params.room,
      action: params.action,
      target_identity: params.targetIdentity,
      requester_identity: params.requesterIdentity,
      target_client_id: params.targetClientId || '',
      reason: params.reason || '',
    }),
  });
  return parseJson<{
    ok: boolean;
    error?: string;
    message?: string;
    target_trust?: number | null;
  }>(res);
}

export type ReportReasonCode =
  | 'POLITICAL_EXTREMISM'
  | 'NSFW_CANVAS'
  | 'OFFENSIVE_VOICE'
  | 'FLOOD_SPAM'
  | 'HARASSMENT'
  | 'DISCRIMINATION'
  | 'EXTREMISM'
  | 'BOARD_SABOTAGE'
  | 'NOISE_TROLLING'
  | 'ILLEGAL_CONTENT';

export async function postReport(params: {
  room: string;
  reporterIdentity: string;
  reporterClientId: string;
  targetIdentity?: string;
  targetClientId?: string;
  reason?: string;
  reasonCode?: ReportReasonCode | string;
  body: string;
  canvasJpegB64?: string;
  extraJpegB64?: string;
  boardPngB64?: string;
  boardStateJson?: string;
  chatSnapshot?: Array<{ id?: string; name?: string; text?: string; ts?: number }>;
  /** Stub note when rolling audio buffer is not available. */
  audioRef?: string;
}): Promise<{
  ok: boolean;
  message?: string;
  target_trust?: number | null;
  auto_restricted?: boolean;
  restrictions?: LoungeRestrictions | null;
  reason_code?: string | null;
}> {
  const res = await fetch('/api/lounge/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: params.room,
      reporter_identity: params.reporterIdentity,
      reporter_client_id: params.reporterClientId,
      target_identity: params.targetIdentity || '',
      target_client_id: params.targetClientId || '',
      reason: params.reason || 'user_report',
      reason_code: params.reasonCode || '',
      body: params.body,
      canvas_jpeg_b64: params.canvasJpegB64 || '',
      extra_jpeg_b64: params.extraJpegB64 || '',
      board_png_b64: params.boardPngB64 || '',
      board_state_json: params.boardStateJson || '',
      chat_snapshot: params.chatSnapshot || [],
      audio_ref: params.audioRef || '',
    }),
  });
  return parseJson(res);
}

export async function postAiConsent(params: {
  room: string;
  identity: string;
  clientId?: string;
  granted: boolean;
}): Promise<AiConsentResponse> {
  try {
    const res = await fetch('/api/lounge/ai/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: params.room,
        identity: params.identity,
        client_id: params.clientId || '',
        granted: params.granted,
      }),
    });
    return parseAiJson<AiConsentResponse>(res);
  } catch {
    return {
      ok: false,
      degraded: true,
      hint: 'Сервер согласия недоступен (локально сохранено)',
    };
  }
}

export async function postAiStt(params: {
  room: string;
  identity: string;
  text: string;
  consent: boolean;
}): Promise<AiSttResponse> {
  try {
    const res = await fetch('/api/lounge/ai/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: params.room,
        identity: params.identity,
        text: params.text,
        consent: params.consent,
      }),
    });
    return parseAiJson<AiSttResponse>(res);
  } catch {
    return {
      ok: false,
      degraded: true,
      error: 'network',
      hint: 'STT временно недоступен — комната работает',
    };
  }
}

export async function postAiCoach(params: {
  room: string;
  identity: string;
  text: string;
  lang?: string;
  cefr?: string;
  consent: boolean;
}): Promise<AiCoachResponse> {
  try {
    const res = await fetch('/api/lounge/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: params.room,
        identity: params.identity,
        text: params.text,
        lang: params.lang || 'ru',
        cefr: params.cefr || 'any',
        consent: params.consent,
      }),
    });
    return parseAiJson<AiCoachResponse>(res);
  } catch {
    return {
      ok: false,
      degraded: true,
      error: 'network',
      hint: 'Разбор временно недоступен',
      notes: '',
      fillers: [],
      alternatives: [],
    };
  }
}
