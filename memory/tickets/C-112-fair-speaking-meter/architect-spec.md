# Architect-spec — W-43 / C-112–C-114

## Цель
Комната ощущается учебным тренажёром: баланс речи, общий словарь, таймер реплики.

## Инварианты
- Multi-party; mute-by-default; mock-ахперики не в meter/lexicon sync.
- DataChannel topic prefix `vernatun:` JSON `{ type, ... }` reliable.
- Не ломать SFU при ошибке parse; graceful ignore.
- API `/api/lounge/*` без изменений; VPS нет; data-safety.

## Протокол DataChannel

```ts
type VernMsg =
  | { type: 'lexicon.add'; id: string; hy: string; phonetic: string; ru: string; tag?: string; by: string }
  | { type: 'timer.start'; endsAt: number; durationSec: number; by: string } // endsAt = Date.now()+ms epoch
  | { type: 'timer.reset'; by: string };
```

Encoder/helper: `src/utils/roomDataChannel.ts` — publish + subscribe once in RoomConnected, прокидывать callbacks.

## C-112 Fair Meter
- Состояние `Record<identity, ms>` в `useFairSpeakingMeter` (tick 250ms пока speaking).
- UI: под списком или в panel-head — полоски % от суммы; у row мини-bar.
- Не показывать для mock rows.

## C-113 Lexicon
- Board phrases `button`/clickable → emit `lexicon.add`.
- State `lexicon[]` в RoomConnected; merge by id (dedupe hy+ru).
- `RoomSidePanel` tab словарь рендерит список + «В мой SRS» → `localStorage` key `vernatun-srs-v1`.
- Highlight «слово сессии» = последняя добавленная.

## C-114 Timer
- BoardPanel: `timerSecLeft`, `running`, callbacks onStart/onReset.
- Host sync: любой может start/reset; `endsAt` absolute → все считают локально `max(0, endsAt - now)`.
- Visual: прогресс-кольцо/полоска; at 0 — class `is-ended`, не mute.

## Paths
- `src/utils/roomDataChannel.ts` (new)
- `src/hooks/useFairSpeakingMeter.ts` (new)
- `BoardPanel.tsx`, `RoomConnected.tsx`, `RoomSidePanel.tsx`, `ParticipantList.tsx` (meter bars)
- `room.css` (+ minor)

## Chain
```
Архитектор → Frontend (C-112→C-113→C-114) → Тестировщик → Фиксер → Деплоер localhost → Клиент
```
