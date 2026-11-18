# Architect spec — W-52 (C-145, C-146, C-147)

## Цель

1. **C-145** — заменить мокап-доску на self-host **Spacedeck Open**.
2. **C-146** — правая колонка **640px** (≥1024); чат реально пишет и показывает ошибки.
3. **C-147** — рамка на доске → OCR → «Добавить в словарь» + перевод в общий lexicon.

## Источник Spacedeck

- GitHub: https://github.com/spacedeck/spacedeck-open  
- Лицензия: **AGPL-3.0** (форк/модификации → открывать исходники при сетевом использовании).  
- Docker Hub: `spacedeck/spacedeck-open` (устаревший образ — предпочтительно **build из git** + `docker compose`).  
- Порт по умолчанию: **9666**.

## Хранение PDF на VPS (ответ владельцу)

| Что | Где |
|-----|-----|
| Файлы (PDF→картинки, картинки, аудио) | папка **`storage/`** на диске сервера (Docker volume), либо S3 если настроим |
| Метаданные досок (Spaces) | **`database.sqlite`** (том на диске) |
| Авто-удаление в Spacedeck | **нет** — файлы лежат, пока админ не удалит Space/файл вручную |

**Политика Vernatun (обязательная в MVP):**

- Volume: `liverooms/infra/spacedeck-data/storage` + `…/database.sqlite` (localhost; на VPS — `/var/lib/vernatun/spacedeck/…`, **не** трогать sputnik_data).  
- Retention: **7 дней** после последнего участника в комнате **или** явная «Очистить доску» хостом — Backend cron/hook удаляет Space media (spec: `POST /api/lounge/board/purge` + runbook). До внедрения cron — документировать «лежит на диске, пока не почистим».  
- Лимит аплоада (целевой): PDF ≤ **20 MB**, предупреждение в UI.

## Архитектура интеграции

```
[Room UI] --iframe--> /spacedeck/*  --proxy--> Spacedeck:9666
                \
                 \-- overlay OCR (parent) --> Tesseract.js --> lexicon DataChannel
                                                          \--> optional POST /api/lounge/ai/translate
```

- Одна **Space на roomId** (создаётся при первом входе; URL в `rooms.json` / dynamic: `board_url`).  
- Guest/share link без отдельного логина Vernatun (Spacedeck public share или общий guest user — зафиксировать в Backend).  
- Мокап `BoardPanel` demo phrases **убрать** из центра; scenario timer / lexicon hints — тонкая полоска **над** iframe, не вместо доски.

## C-146 Chat

- CSS: `.room-col--chat { width: 640px }` (≥1024).  
- Input: **не** `disabled` только из‑за `!connected` — разрешить набор; send disabled с aria/hint «подключение…» / показать `error` из API.  
- Проверить wipe `maybe_clear_chat` при false-zero online — не стирать историю при ошибке LiveKit API.  
- Form всегда внизу flex (`min-height` / sticky).

## C-147 OCR

- Режим «Рамка для словаря»: overlay поверх iframe, draw rect.  
- Capture: same-origin proxy → `iframe.contentDocument` canvas/`html2canvas` crop; fallback — ручной ввод распознанного текста.  
- Кнопка **«Добавить в словарь»** над rect → `lexicon.add` + `translation` (AI Bridge stub/degraded или LibreTranslate later).  
- Tesseract langs: `hye+rus+eng` (если hye нет — `rus+eng` + note).

## Границы

- VPS cutover — только после Клиента.  
- Не удалять `sputnik_data.db` / `memory_storage`.  
- AGPL: в `liverooms/infra/spacedeck/NOTICE.md` ссылка на upstream.

## Acceptance (язык Клиента)

1. В комнате все видят одну доску; PDF на доске виден другим.  
2. Правая панель заметно шире; в чат можно писать и сообщение появляется у себя (и у второго участника).  
3. Рамка → кнопка → слово в словаре с переводом.
