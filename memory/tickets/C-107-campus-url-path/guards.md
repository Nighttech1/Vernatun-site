# Guards — C-107 campus URL path

## Regression
1. `http://127.0.0.1:5173/campus` → 200, Lobby, title «Кампус»
2. `http://127.0.0.1:5173/lounge` → client redirect на `/campus`
3. `http://127.0.0.1:5173/` → redirect на `/campus`
4. Link «Голосовые комнаты» и brand → `/campus`
5. Exit из комнаты → `navigate('/campus')`
6. API paths `/api/lounge/*` **без изменений**

## Visual
- `visual/after-url-campus.png` (лобби на `/campus`)
