# Spacedeck Open — Vernatun Campus

Upstream: https://github.com/spacedeck/spacedeck-open  
License: **AGPL-3.0** (сетевое использование модификаций требует открытия исходников).

## Localhost

```powershell
cd e:\Applications\Vernatun\liverooms\infra\spacedeck
docker compose up -d --build
```

UI: http://127.0.0.1:9666  
Invite code (signup): `vernatun-local`

Volumes: `./storage` (PDF/media), `./database` (SQLite).

## Где лежат тяжёлые PDF на VPS

На диске сервера в томе Spacedeck:

- **Файлы** (PDF→картинки, фото) → каталог `storage/`
- **База досок** → `database/database.sqlite`

**Удаление:** когда в комнате LiveKit подтвердил **0 участников**, Lounge API вызывает `purge_board` — Space удаляется и файлы `s{space_id}*` стираются с диска. Не путать с `sputnik_data.db`.

## Без логина

Каждая комната получает Instant Edit Link (`?spaceAuth=` + `nickname=` из ахперика). Аккаунт Spacedeck гостю не нужен.

