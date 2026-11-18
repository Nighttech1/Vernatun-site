# Architect-spec — W-38 / C-97–C-99

## Цель
Перерисовать React Lounge SPA (`liverooms/web`) под **Modern Swiss Editorial** по референсам campus (лобби) и room (interior), **не** меняя медиа/API и **не** внедряя Stage-очередь.

## Референсы
| Файл | Экран |
|------|--------|
| `references/vernatun_campus_modern_swiss_editorial/{screen.png,code.html}` | Каталог |
| `references/vernatun_room_modern_swiss_editorial/{screen.png,code.html}` | Комната |

## C-97 — DESIGN.md
Путь: `liverooms/web/DESIGN.md`

### Токены (норматив из campus code.html + room)
| Token | Value | Role |
|-------|-------|------|
| `--brand-terracotta` | `#C25E28` | CTA / accent brand |
| `--brand-terracotta-dark` | `#A34B1C` | hover CTA |
| `--brand-amber` | `#E5A93C` / badges `#D97706` | LIVE / level accents |
| `--brand-navy` | `#1E293B` | dark cards / primary dark btn |
| `--brand-slate` | `#0F172A` | ink text |
| `--brand-surface` | `#F8F9FA` | page bg |
| `--brand-cream` | `#FDFBF7` | hero wash |
| `--brand-border` | `#E2E8F0` | hairlines |
| Level pastels | soft blue/green/amber chips | CEFR badges |

### Typography
- **Sans:** Plus Jakarta Sans (Google Fonts) — UI body/headings  
- **Mono labels:** Space Grotesk — LIVE, CEFR, meta uppercase  
- Century Gothic **не** обязателен в Lounge SPA этой волны (лендинг static не трогаем)

### Layout language
- 8pt rhythm, rounded-xl (~12–16px), soft shadow-sm  
- Hairline borders slate-200; generous whitespace  
- Anti-slop: no purple mesh; no Inter-only luxury claim; no dating UI

### Product overrides vs room reference
| Ref shows | We do |
|-----------|--------|
| Speakers on stage + listeners + raise hand | **Single multi-party list**; no raise-hand as gate |
| Full interactive board / PDF / poll | **Stub center panel** (title + steps + status) only |
| Fake demo participants | Real LiveKit participants only |

## C-98 — Lobby
Files: `LobbyPage.tsx`, `Layout.tsx`, `app.css` / new `campus.css`

Structure:
1. Campus sticky header (logo wordmark + LIVE chip)
2. Editorial hero (stats from sum of `online`; CTA → `/room?room=open` or first room)
3. CEFR filter tabs (existing filter logic)
4. Responsive card grid (`rooms` from API)
5. Optional soft banner «правило дружелюбной среды» → link text only

## C-99 — Room shell
Files: `RoomPage.tsx`, `RoomConnected.tsx`, `ParticipantList.tsx`, `ChatPanel.tsx`, new layout CSS

Desktop (≥1024):
```
[ Top bar ]
[ Participants | Center stub | Chat ]
```
Mobile: column stack or 3 tabs — no horizontal page scroll.

Keep: LiveKitRoom, RoomAudioRenderer, mute-default, token/chat APIs, share link.

## Chain order
1. Frontend: C-97 DESIGN.md + tokens.css  
2. Frontend: C-98 Lobby  
3. Frontend: C-99 Room  
4. Motion (light): live-dot pulse, optional wave bars — **after** layout green  
5. Tester → Fixer → Deployer localhost → Client  

Backend: **not** in chain. Deployer: localhost only.

## Acceptance (Client language)
1. Лобби визуально «как campus-реф», не старый parchment-list.  
2. Комната визуально «как room-реф» по каркасу, но все могут говорить без «руки».  
3. Desktop 1440 + iPhone/Android без горизонтального скролла.  
4. Join/mic/chat/share работают как в W-37.
