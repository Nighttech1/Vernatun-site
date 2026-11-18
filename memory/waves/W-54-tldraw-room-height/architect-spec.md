# Architect — W-54 tldraw + room height

## C-150
- Убрать Spacedeck iframe из `BoardPanel`.
- Пакет `tldraw` + `tldraw/tldraw.css`.
- `<Tldraw hideUi persistenceKey={room-…} />` на 100% родителя.
- Дочерний toolbar: Стрелка=`select`, Карандаш=`draw`, Текст=`text` через `useEditor().setCurrentTool`.
- Tailwind: в проекте нет глобального TW — панель с utility-классами `tw-*` (Tailwind prefix) только для доски, чтобы не сломать room.css. Дизайнер потом выровняет под бренд.

## C-151
- `LiveKitRoom` / fragment не тянут высоту → wrapper `.room-session` + `html/body/#root` height chain + `.room-app` 100dvh.

## Chain
Frontend → Tester → Deployer localhost → Клиент  
После зелёного: **Designer brief** C-152.

## Out of scope этой волны
- Multiplayer sync tldraw (можно позже)
- Spacedeck Docker можно оставить выключенным
