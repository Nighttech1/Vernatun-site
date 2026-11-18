# Vernatun

Сайт армянского разговорного клуба, Кампус, панель владельца и API.
Актуальная локальная версия перенесена 19 ноября 2026 года из `E:\Applications\Vernatun`.

Репозиторий: https://github.com/Nighttech1/Vernatun-site
Сайт: https://vernatunspeakclub.com

## Как продолжать работу

Рабочая ветка — `main`. Перед началом работы выполните `git pull --ff-only`.
После изменений сделайте коммит и `git push origin main`.
GitHub Actions проверяет статьи, устанавливает зависимости, собирает Кампус и автоматически выкладывает новую версию на VPS.
Результат: https://github.com/Nighttech1/Vernatun-site/actions
Деплой также можно запустить вручную через **Run workflow**.

## Локальный запуск

Статический сайт:

```powershell
python scripts/dev_server.py
```

Кампус:

```powershell
cd liverooms/web
npm ci
Copy-Item .env.example .env.local
npm run dev
```

API должен быть доступен по адресу из `VITE_API_PROXY_TARGET`.
Настройка локального API и LiveKit описана в `liverooms/infra/README.md`.

Проверки перед отправкой:

```powershell
npm run articles:validate
cd liverooms/web
npm run build
```

## Автодеплой

Workflow: `.github/workflows/deploy.yml`.
Архив релиза включает публичный сайт, сборку Кампуса, панель владельца и исходники API.
На VPS используется существующая схема релизов `/opt/vernatun-web/releases` с переключением `current`.
Перед переключением сохраняются настройки сервера и рабочие данные; предыдущий релиз записывается в `/var/backups/vernatun-web/<timestamp>/previous-release`.

В GitHub Actions настроены secrets: `VPS_HOST`, `VPS_USER`, `VPS_DEPLOY_KEY`, `VPS_KNOWN_HOSTS`.
Отдельный SSH-ключ разрешает только `/opt/vernatun-web/github-receive.sh`; интерактивный вход и перенаправление портов запрещены.
Серверный обработчик хранится в `scripts/github-vps-receive.sh`; изменения этого файла устанавливаются на VPS владельцем отдельно.
Существующий серверный `/opt/vernatun-web/release.sh` соответствует `scripts/selectel-web-release.sh`.

Ключи, `.env`, переписки, сессии, обращения пользователей, базы данных, установленные зависимости и временные результаты проверок не включаются в репозиторий.
Серверные `/etc/vernatun-web` и `/var/lib/vernatun-web` остаются источником рабочих данных.
Не запускайте bootstrap-скрипты для обычного обновления.

Старые инструкции в `memory`, `tasks` и `liverooms/campus-data/README.md` отражают историю разработки. Актуальная схема VPS описана в `docs/SELECTEL_DEPLOYMENT.md` и этом README.

## Legacy Spacedeck

`liverooms/infra/spacedeck` сохранён как исходники с локальными изменениями (upstream: https://github.com/spacedeck/spacedeck-open, commit `a5914ab600e9f4ae3f42d9361195a3696843903e`). Лицензия сохранена. Рабочие базы и хранилище исключены. Текущий Кампус использует tldraw.
