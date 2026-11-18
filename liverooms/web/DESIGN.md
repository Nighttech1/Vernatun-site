---
version: alpha
name: Vernatun Lounge — Modern Swiss Editorial
description: Design language for the React Campus SPA (lobby + room shell). Sourced from campus and room Swiss Editorial references; product overrides preserve multi-party voice rooms without stage-queue UX.
colors:
  brand-terracotta: "#C95B36"
  brand-terracotta-dark: "#A34B1C"
  brand-amber: "#E6B25A"
  brand-amber-badge: "#D97706"
  brand-azure: "#2A5A84"
  brand-azure-dark: "#1F4668"
  brand-surface: "#F9F6F0"
  brand-cream: "#FDFBF7"
  brand-border: "#E8E2D8"
  live-red: "#DC2626"
  live-green: "#059669"
typography:
  sans:
    fontFamily: Century Gothic
  mono:
    fontFamily: Century Gothic
rounded:
  base: 12px
  xl: 16px
spacing:
  unit: 8px
routes:
  lobby: /campus
  room: /room
  legacy_lobby_redirect: /lounge → /campus
---

## Overview

Vernatun Lounge (**Кампус**) is a voice-room SPA for Armenian-language practice. Public lobby URL is **`/campus`** (legacy `/lounge` redirects). Visual language follows **Modern Swiss Editorial** layout from campus/room references, with the **site brand typeface Century Gothic** (not Plus Jakarta / Inter). High-contrast **azure** ink on warm **parchment** surfaces, terracotta CTAs, uppercase meta labels, generous whitespace, and hairline borders — same azure/terracotta/parchment as vernatunspeakclub.com.

Product invariant: **multi-party** rooms (everyone can speak after unmuting). Reference room mockups show stage/listeners and raise-hand; **do not ship those as product gates**.

Section name in chrome: **«Кампус»** (RU).

## Colors

- **Azure** `{colors.brand-azure}` — primary brand blue: body ink, headings, secondary CTAs, filter active chips, wordmark, join buttons on cards, featured card wash.
- **Azure dark** `{colors.brand-azure-dark}` — featured gradient end / borders on dark panels.
- **Terracotta** `{colors.brand-terracotta}` — primary CTA, brand accent, selection highlight (site `#C95B36`).
- **Terracotta dark** `{colors.brand-terracotta-dark}` — CTA hover.
- **Surface / cream** `{colors.brand-surface}` / `{colors.brand-cream}` — parchment page background and hero wash (`#F9F6F0`).
- **Border** `{colors.brand-border}` — hairlines (mist).
- **Amber** `{colors.brand-amber}` / `{colors.brand-amber-badge}` — LIVE chips, level accents.
- **CEFR pastels** — soft blue (A0–A1), green (A2–B1), rose (B2–C1), amber (open/any).
- **Do not** use navy `#1E293B` / slate `#0F172A` as the main brand blue.

## Typography

- **All UI text** `{typography.sans.fontFamily}` — loaded from `/fonts/CenturyGothic.ttf` (+ Bold), same as vernatunspeakclub.com landing.
- Meta / LIVE / CEFR labels use the same face with uppercase + tracking (no second Google font).
- Do not load Plus Jakarta Sans or Space Grotesk in this SPA.

## Layout

- **8pt rhythm** — padding/margins in multiples of `{spacing.unit}`.
- **Max width** — `80rem` (1280px) content shell on lobby; room uses full viewport height.
- **Lobby grid** — 1 col mobile, 2 cols `md`, 3 cols `lg` for room cards.
- **Room desktop** — ≥1024px three columns: participants (~260px) | center (flex) | chat (~320px).
- **Room mobile** — stacked tabs (Участники / Комната / Чат); **no horizontal page scroll**.

## Elevation & Depth

- Cards: `shadow-sm`, hover `shadow-md`; borders `1px solid brand-border`.
- Hero: subtle gradient `white → cream → amber/40`, rounded `{rounded.xl}`.
- Room top bar: white, bottom border only; columns scroll independently.

## Shapes

- Buttons/cards: `{rounded.base}`–`{rounded.xl}` (12–16px), pills for chips/filters.
- Avatars: full circle with 2px ring.

## Components

### Campus header (lobby)

Sticky white/blur bar: wordmark **VERNATUN** + **CAMPUS** chip + **LIVE** pill. Links to `/campus`. No fake user profile in MVP.

### Editorial hero

Live stats chip (rooms in air + total online from API sum), H1 with terracotta underline accent, primary CTA quick-enter (`open` or first room), secondary rules link.

### Room card

LIVE pulse when `online > 0`; CEFR badge; title + description; online count; **azure** join CTA (terracotta on featured).

### Room top bar

Exit · live/connecting badge · truncated title · online count · mic toggle · share. No raise-hand, no workspace tabs (board/PDF/poll) in this wave.

### Participants panel

Single sorted list with initials avatar, speaking dot + optional wave bars. No stage/listener split.

### Center panel (stub)

Room topic, join steps pre-connect, status line post-connect. Full whiteboard out of scope.

### Chat panel

Header «Чат», scrollable messages, terracotta send button; same REST API as before.

## Do's and Don'ts

**Do** use azure/terracotta/parchment tokens consistently; pulse LIVE dots with CSS only; keep mute-by-default and LiveKit flow unchanged; lobby path `/campus`.

**Don't** use navy `#1E293B` as primary brand; Inter-only as the luxury voice; purple mesh gradients; dating-app UI; mandatory raise-hand or stage queue; fake demo participants; delete static `lounge.html` / `room.html`; deploy prod cutover without Client + explicit VPS OK.
