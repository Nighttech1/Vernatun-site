/** Campus Sentinels — Evidence-First (W-66 / C-217). Sanctions OFF. */

export type SentinelId =
  | 'agenda'
  | 'tone'
  | 'canvas18'
  | 'spam'
  | 'bounds';

export type SentinelSurface = 'chat' | 'shape' | 'canvas';

export type SentinelHit = {
  sentinelId: SentinelId;
  rule: string;
  score: number;
  snippet: string;
};

export type SentinelMatchContext = {
  text?: string;
  /** Recent stroke timestamps (ms) for vandalism heuristic. */
  strokeTimestamps?: number[];
  /** Precomputed NSFW scores from evaluateCanvasSafety. */
  nsfwScores?: Record<string, number>;
  nsfwHit?: boolean;
};

export type SentinelScanner = {
  id: SentinelId;
  scan: (ctx: SentinelMatchContext) => SentinelHit | null;
};

export type IncidentEvidence = {
  kind: 'png_b64' | 'text' | 'meta';
  payload: string;
};

/** Architect-spec POST /api/lounge/incidents body. */
export type IncidentPayload = {
  room: string;
  sentinel_id: SentinelId;
  surface: SentinelSurface;
  identity: string;
  client_id: string;
  target_id: string | null;
  snippet: string;
  evidence: IncidentEvidence;
  matched: { rule: string; score: number };
};

export type RunSentinelPipelineArgs = {
  roomId: string;
  identity: string;
  clientId: string;
  surface: SentinelSurface;
  ctx: SentinelMatchContext;
  targetId?: string | null;
  shapeIds?: string[];
  /** Capture PNG base64 (no data: prefix) when available. */
  captureEvidencePng?: () => Promise<string | undefined>;
  /** Delete offending shapes / hide chat after successful POST. */
  onRemoveContent?: (hit: SentinelHit) => void | Promise<void>;
  /** Soft toast — never “you are banned”. */
  onToast?: (message: string) => void;
};
