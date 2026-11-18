# Architect-spec — W-63 / C-196

## Проблема
React StrictMode + повторный `/token` создают вторую identity → `enforce_single_session` снимает первую через LiveKit `remove_participant` → клиент видит lifecycle «Вас исключили» (PARTICIPANT_REMOVED). Параллельно `ensure_session_started` уже запустил таймер комнаты на первом токене.

«Кривое окно» = LegalGate / tab-block / room-lifecycle / pre-join Board shell — не полноценная комната.

## Решение
1. **FE:** module-level join mutex `(roomId|clientId)` — один in-flight token на пару; игнор устаревшего ответа.
2. **FE:** grace 4s после connect: `PARTICIPANT_REMOVED` / `DUPLICATE_IDENTITY` → silent auto-rejoin 1 раз, не kick-экран (если не host-kick с moderation intent — опционально: только если `session_override` был в последнем токене).
3. **BE:** `ensure_session_started` только если в комнате уже есть ≥1 participant **или** это первый успешный token и online==0 — **оставить как есть** (таймер комнаты = продукт). Документировать Клиенту: таймер комнаты не персональный.
4. **BE:** не вызывать `remove_livekit_participant` для identity, которой ещё нет в комнате (no-op уже); добавить debounce: если prev identity age < 2s и тот же client — skip remove если LiveKit ещё не показал participant (избежать race).

## Acceptance
Войти в комнату один раз → остаётесь в RoomConnected ≥30s без lifecycle kick; таймер в лобби отражает реальную сессию.
