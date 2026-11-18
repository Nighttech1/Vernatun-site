# Guards — C-154 Vernatun whiteboard TZ

## Regression
1. Доска заполняет высоту колонки комнаты (не ~50%).
2. Стандартный UI tldraw скрыт (`hideUi` + null components).
3. Плавающий тулбар снизу по центру: select / laser / draw / highlight / eraser / vocab / audio / note / PDF / stamps / summon(host).
4. VocabCard создаётся кнопкой «карточка»; AudioSnippet — через file input audio.
5. PDF: страница locked; PdfPageNav сверху при pageCount > 0.
6. Listener: только laser + stamps (кнопки остальных disabled).
7. Host: «все ко мне» шлёт `board.summon`; PDF page — `board.pdf.page`.
8. Без `VITE_TLDRAW_LICENSE_KEY` watermark может быть виден (C-153 не закрывать CSS-хаком).

## Commands
```
cd liverooms/web && npx tsc --noEmit
```
