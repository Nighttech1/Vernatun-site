# Architect — W-55 Vernatun Whiteboard TZ

## C-153
Официально: `licenseKey` через `VITE_TLDRAW_LICENSE_KEY` (ToS tldraw). CSS-скрытие watermark запрещено.
Без ключа — watermark остаётся; hint в chrome доски.

## C-154 modules
```
components/whiteboard/
  CustomToolbar.tsx
  PdfPageNav.tsx
  VernatunWhiteboard.tsx
  shapes/VocabCardShape.tsx
  shapes/AudioSnippetShape.tsx
  utils/pdfLoader.ts
  utils/boardRoles.ts
  utils/boardSync.ts  // summon + pdf page via DataChannel
```

## Roles
- listener: laser + stamps only
- speaker: laser, draw, highlight, eraser(own), vocab, audio, note, stamps; no PDF delete / summon / clear
- host: full + summon + PDF nav

## Sync (MVP)
- Summon camera + PDF page index via existing `vernatun` DataChannel topics `board.summon` / `board.pdf.page`
- Persistence: local `persistenceKey` per room (multiplayer CRDT — later)

## Chain
Frontend → Tester → Deployer → Клиент
