# Regression guards — Client

- 2026-09-09 W-03: text computed `rgb(42, 90, 132)` on h1/body/nav/footer (C-07).
- 2026-09-09 W-03: `#formats/#atmosphere/#faq` `.reveal` opacity 1 after load (C-08).
- 2026-09-09 W-03: `.site-footer-grid` 6 columns at 1440 (C-09).
- 2026-09-10 W-06: fixed header overlays video; white nav on hero / azure when solid; CTA always white on terracotta; denser gallery (C-15/16/17).
- 2026-09-10 W-07/W-08: opaque dropdown parchment; scroll reveal (no eager visible); Century Gothic global; club azure×3 + sports copy + seamless club/formats; formats hover desc; atmosphere side gutters; footer underline (C-18…C-23).
- 2026-09-10 W-09: morph mega menu; about titles-only; CTA Приѝоединитьѝѝ→MASClubb; bold nav; formats 3×2 + dance/padel; atmosphere wheel-lock; film cover zoom vars (C-24…C-26).
- 2026-09-10 W-10: film quote delay+RU mark; smooth 8-photo gallery; FAQ×10 from prod; schedule pills; nav FAQ/plain links; left headers (C-27…C-29).
- 2026-09-10 W-11: header-bg from IMG_7185.MOV @1.41→end loop; global scroll reveal (C-30/C-31).
- 2026-09-10 W-12: page titles max-w-7xl align; wider calendar pills; CTA/detail shift; copy; footer logo-only (C-32…C-34).
- Shots: `w12-schedule.png`, `w12-footer-bottom.png`.
- 2026-09-11 W-21: mobile menu opaque drawer + brand azure; circular `touch-action: pan-y`; schedule short pills ≥44px (C-55/56/57). Shots: `memory/waves/W-21-mobile-premium/after/`.
- 2026-09-11 W-22: header CTA ≥44 + safe-area; formats desc always on mobile; magazine «Открыть» pill cards (C-58/59/60). Shots: `memory/waves/W-22-mobile-premium/after/`.
- 2026-09-11 W-23: cal month nav 44; header logo-only ≤430; podcast PDF mobile card (C-61/62/63). Final audit issues=[]. Shots: `memory/waves/W-23-mobile-premium/final/`.
- 2026-09-20 W-37: React Lounge SPA `liverooms/web` — lobby filter+rooms, room shell LiveKit mute-default + share/chat (C-94/95/96). Localhost `http://127.0.0.1:5173/lounge`. Shots: `memory/waves/W-37-after-*.png`. Dual-peer audio = Client manual.
- 2026-09-21 W-38: Swiss Editorial visual — DESIGN.md + campus lobby + room 3-col shell multi-party (C-97/98/99). Shots: `memory/waves/W-38-after-*.png`. No Stage-queue.
- 2026-09-21 W-39: Header «Кампуѝ» + Century Gothic site font + lobby/room ref fidelity (C-100/101/102). Shots: `memory/waves/W-39-after-*.png`.
- 2026-09-21 W-40: Campus nav + lobby filters + room didactic board stub + side tabs (C-103/104/105). Shots: `memory/waves/W-40-after-*.png`.
- 2026-09-21 W-41: Campus azure `#2A5A84` + parchment `#F9F6F0` (no navy primary); lobby URL `/campus` + `/lounge`→`/campus` (C-106/C-107). Shots: `memory/tickets/C-106-azure-brand-colors/visual/after-*.png`. Prod cutover C-108 backlog until explicit VPS OK.
- 2026-09-21 W-42: Lobby hero/nav/featured cleanup; instant room join; nick dblclick + per-room board demos + 4 mock ahperiks (C-109/110/111). Shots: `memory/tickets/C-109-*/visual/`, `C-111-*/visual/`.
- 2026-09-22 W-43: Fair Speaking Meter + Shared Lexicon (DataChannel) + Scenario turn timer 60s (C-112/113/114). Shot: `memory/tickets/C-114-scenario-turn-timer/visual/after-board-timer-lexicon.png`.
- 2026-09-22 W-44: Anti-dating/no-DM copy; kicked/ended/reconnect UI; host mute/kick API+UI (C-115/116/117). Shot: `memory/tickets/C-115-anti-dating-no-dm/visual/after-room-safety.png`. Live moderation needs lounge_api.py deploy.
- 2026-09-22 W-45: Static nav «Кампуѝ»; Trust Score + report API/UI; dual-peer checklist + mic aria (C-118/119/120). Live trust/report needs lounge_api.py deploy.

- 2026-09-26 W-58: Campus safety pre-deploy � LegalGate 18+ before LiveKit token; single-tab BroadcastChannel; chat sanitize/422; NSFW client scanner + canvas-violation audit; report reason_code + auto-restrict after 3 (C-169�C-173). Localhost API :8765 + Vite :5173. Guards: `memory/tickets/C-169-*/guards.md` � `C-173-*/guards.md`. VPS only after Client ������������.
- 2026-09-27 W-65: Room report target dropdown + full reasons; no plaque ???? ???2�?????; guest canvas banner; shape author labels; host toolbar icons+centered confirms; admin checkbox inside card; moderation robots help �3 keyword bots (C-209?C-215). Localhost :5173/:5174/:8765. Guards: `memory/tickets/C-209-*/guards.md` ? `C-215-*/guards.md`.
- 2026-09-27 W-66: Mobile room QA (H-scroll + CTA); Campus Sentinels x5 Evidence-First (bounds->HATE, spam->SHIELD); guest banner orange/white; author labels local-only; board lock no-confirm + blue active; images-only upload; LegalGate spacing; draw color/size popover (C-216..C-223). Localhost :5173/:8765. Shots: `memory/waves/W-66-shots/`. Guards: `memory/tickets/C-216-*/guards.md` .. `C-223-*/guards.md`.
- 2026-09-27 W-67: LegalGate white disclaimer; resizable chat; toolbar drag; peer.rename + LiveKit tldraw sync; Fair Meter removed; admin sentinel Settings; empty-room session wipe sweeper; 10-min orange end banner + kick/wipe (C-224�C-231). Localhost :5173/:5174/:8765. Guards: `memory/tickets/C-224-*/guards.md` � `C-231-*/guards.md`.
- 2026-09-27 W-68: NameGate entry nick; peer.hello roster; report live nicks; board style sync; azure author chips; chat emoji; admin layout/purge/lightbox/robot filters; owner-pattern chat kick + board text MVP (C-232…C-240). Localhost :5173/:5174/:8765. Guards: memory/tickets/C-232-* … C-240-*.
