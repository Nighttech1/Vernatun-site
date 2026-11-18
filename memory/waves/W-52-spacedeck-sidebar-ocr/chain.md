# Chain — W-52

1. **Архитектор** — `architect-spec.md` (этот каталог)
2. **Деплоер / Realtime** — Docker Spacedeck + volume `storage` (localhost); не wipe данных
3. **Backend** — board Space URL per room; retention policy docs + optional cleanup hook; chat не ломать
4. **Frontend** — C-146 sidebar 640px + chat input UX; C-145 embed Spacedeck; C-147 selection overlay + OCR → lexicon
5. **AI Bridge** — translate endpoint or client-side/degraded stub for lexicon translation
6. **Тестировщик** — guards + smoke
7. **Фиксер** — до зелёного
8. **Деплоер** — localhost redeploy
9. **Клиент** — приёмка

Overlapping: `BoardPanel.tsx` / `room.css` / `lounge_api.py` — не параллелить FE+BE без очереди.
VPS — только после Клиента «да».
