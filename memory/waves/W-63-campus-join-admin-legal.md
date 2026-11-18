# W-63 — Join fix + Campus UI + Admin reports + Legal

**before_sha:** n/a (не git root)
**Тикеты:** C-196 (P0), C-199 (P0), C-200 (P0), C-197 (P1), C-198 (P1), C-201 (P1)

## Chain (порядок)

1. Архитектор — spec + chain per ticket
2. Backend — C-196 session/join race, C-199 evidence fields, C-200 delete/purge API
3. Frontend — C-196 join stability, C-197 spacing, C-198 badge, C-199 admin+report UX, C-201 legal
4. Realtime — только если Backend укажет LiveKit hook для C-196
5. Тестировщик → Фиксер → Деплоер localhost
6. Клиент — приёмка

## Non-overlap

- C-197/C-198: только `LobbyPage` + `campus.css`
- C-199/C-200: `admin/` + `lounge_api.py` delete + report evidence
- C-201: только legal modals
- C-196: `RoomPage` + token/session path (осторожно с admin)
