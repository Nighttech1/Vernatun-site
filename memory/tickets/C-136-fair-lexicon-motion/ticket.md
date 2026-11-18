# C-136 — Лёгкий motion для Fair Meter / лексики

**P2** · W-49 · open

## Зона / Экран
Room shell · Fair Speaking Meter + Shared Lexicon (React Кампус)

## Факт
Фаза 3 P2: meter и лексика уже есть (W-43), но без осмысленного лёгкого motion. На слабых телефонах нельзя допустить jank.

## Ожидание
- Плавное изменение доли meter через **transform/opacity** (не layout thrash); CSS/WAAPI, skill `web-motion-engine`.
- Появление новой карточки лексики: короткий enter (≈150–220ms), без GSAP/Lenis на этом экране.
- `prefers-reduced-motion: reduce` → без анимации (мгновенные состояния).
- Не ломать mute-by-default / multi-party / CTA микрофона.

## Приоритет
P2

## Зона
Motion (+ Frontend paths room.css / ParticipantList / RoomSidePanel)

## Скрин-улика
visual/after.png после фикса на localhost room
