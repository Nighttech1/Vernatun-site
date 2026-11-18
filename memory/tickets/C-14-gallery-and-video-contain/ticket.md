### [C-14] Circular gallery 21st + видео без обрезки
- **Зона / Экран:** `#atmosphere` + `.film-video`
- **Факт:** плоская «карусель»; видео `object-fit: cover` обрезает кадр
- **Ожидание:**
  - Gallery по коду 21st: `rotateY` кольцо, radius ~600, пробелы между карточками, видны задние, auto-rotate + scroll; наши `gallery/*.jpg`
  - Видео: **вписать целиком** (`object-fit: contain`), letterbox на тёмном фоне, ничего не вырезается
- **Приоритет:** P0
- **Зона:** Frontend
