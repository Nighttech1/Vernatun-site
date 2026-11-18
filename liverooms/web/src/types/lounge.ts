export interface LoungeRoom {
  id: string;
  title: string;
  description: string;
  cefr: string;
  online: number;
  locked?: boolean;
  session_active?: boolean;
  remaining_sec?: number;
  duration_sec?: number;
  ends_at?: number;
}

export interface RoomsResponse {
  rooms: LoungeRoom[];
}

export type LeaveReason =
  | 'left'
  | 'kicked'
  | 'ended'
  | 'error'
  | 'superseded'
  | 'policy';

export interface TokenResponse {
  token: string;
  url: string;
  room: string;
  room_title?: string;
  display_name: string;
  identity: string;
  is_host?: boolean;
  trust?: number;
  share_path?: string;
  issued_at?: number;
  error?: string;
  hint?: string;
  min?: number;
  restrictions?: LoungeRestrictions | null;
  session_override?: boolean;
}

export interface LoungeRestrictions {
  mic?: boolean;
  board?: boolean;
  chat?: boolean;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  ts?: number;
  censored?: boolean;
}

export interface ChatGetResponse {
  room: string;
  messages: ChatMessage[];
  error?: string;
}

export interface ChatPostResponse {
  ok: boolean;
  message: ChatMessage;
  censored?: boolean;
  error?: string;
}

export interface AiConsentResponse {
  ok: boolean;
  granted?: boolean;
  hint?: string;
  error?: string;
  degraded?: boolean;
}

export interface AiSttResponse {
  ok: boolean;
  degraded?: boolean;
  transcript?: string;
  provider?: string;
  hint?: string;
  error?: string;
}

export interface AiFillerItem {
  word: string;
  alternatives: string[];
}

export interface AiCoachResponse {
  ok: boolean;
  degraded?: boolean;
  notes?: string;
  fillers?: AiFillerItem[];
  alternatives?: string[];
  toxicity?: boolean;
  hint?: string;
  error?: string;
  identity?: string;
  room?: string;
}
