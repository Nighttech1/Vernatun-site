# Architect-spec — W-58 Campus Safety (C-169…C-173)

**Профиль:** Vernatun Lounge / Кампус  
**Канон:** `liverooms/ARCHITECTURE.md` §7 + skill `voice-room-safety`  
**Источник ТЗ:** `tasks/Безопасность комнат Кампус.md` этапы 1–5

---

## 1. Адаптация стека (обязательно)

| В ТЗ (черновик) | В репо (канон) |
|-----------------|----------------|
| Next.js App Router | Vite + React (`liverooms/web`) |
| NestJS + Socket.io + Prisma + Redis | `liverooms/infra/vps/lounge_api.py` + LiveKit SFU |
| Fabric.js CollaborativeCanvas | tldraw `VernatunWhiteboard` |
| `rooms.gateway.ts` join_room | `POST /api/lounge/…/token` + LiveKit connect |
| PostgreSQL LegalAcceptance | Append-only jsonl в campus-data (как `moderation.log` / `reports.log`) — **без** Prisma в этой волне |
| Redis active_session | In-process dict + файл TTL **или** LiveKit metadata; вытеснение через **RoomService.RemoveParticipant** |

Не переписывать медиа-стек на Socket.io. Не трогать `sputnik_data.db` / `memory_storage`.

---

## 2. Границы волны

**В зоне**
1. **C-169** Single-tab (BroadcastChannel) + server single-session per `client_id` in room.  
2. **C-170** LegalGateModal 18+ + `/api/lounge/legal/consent` + gate before LiveKit connect.  
3. **C-171** Server text sanitize/block on chat POST + audit.  
4. **C-172** Client NSFWJS on board export snapshot + rollback signal + brush lock 120s.  
5. **C-173** Report reasons + evidence blob refs + auto-restrict after 3 distinct reporters.

**Вне зоны (отдельные эпики)**
- VK ID / Яндекс ID / SMS OTP (406-ФЗ) — продуктовое решение после этой волны.  
- Полное хранение контента 6 мес / метаданных 3 года на сертифицированном контуре — ops/юрист, не блокер кода волны.  
- Постоянная серверная запись голоса — запрещена каноном (rolling buffer only on report).

---

## 3. Контракты API (доп. к существующим)

| Endpoint | Поведение |
|----------|-----------|
| `POST /api/lounge/legal/consent` | body: `client_id`, `room_id?`, `is_adult`, `terms_accepted`; сохраняет IP/UA; 400 если флаги false |
| Token / join | Требует валидный legal consent cookie **или** recent consent id для `client_id` (TTL сессии браузера); иначе 403 `legal_consent_required` |
| Token / join | Регистрирует `active_session[room][client_id]=identity`; при конфликте — RemoveParticipant старого identity |
| `POST /api/lounge/chat` | sanitize; 422 `BLOCKED_EXTREMISM_DETECTED` или masked text |
| `POST /api/lounge/moderation/canvas-violation` | audit probabilities + optional stroke id |
| `POST /api/lounge/report` | reason_code enum + optional evidence refs; count → auto restrict |

DataChannel (клиент↔клиент): `canvas:rollback`, `peer:restrict` — согласовать с существующим `roomDataChannel.ts`.

---

## 4. UX / acceptance (языком Клиента)

1. Вторая вкладка той же комнаты: полноэкранный оверлей, нет второго mic/эха.  
2. Без галочек 18+ и соглашений кнопка входа неактивна; без POST consent — комната не подключается.  
3. Мат в чате → звёздочки или отказ; экстремизм → отказ + запись в лог.  
4. Непристойный рисунок → откат у всех в разумные ~3 с, кисть заблокирована 2 мин.  
5. Жалоба с выбором причины; после 3 разных жалоб нарушитель без mic и без доски до конца сессии.

Desktop 1440 + mobile: LegalGate и оверлей вкладки читаемы, CTA ≥44px.

---

## 5. Инварианты

- Mute-by-default и multi-party речь **не** ломать.  
- Host mute/kick (C-161) сохранить.  
- Append-only логи; без wipe на деплое.  
- NSFW inference только в браузере (модель lazy).  
- Автор кода волны ≠ Клиент в том же ходе приёмки.
