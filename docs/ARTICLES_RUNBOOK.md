# Runbook: деплой сайта со статьями + публикация из репозитория агента

## A. Разовый деплой обновлённого сайта на VPS

Выкладывает текущую версию сайта (включая новый пайплайн статей и 5 статей) на
`vernatunspeakclub.com`. Деплой — по scp/ssh (git на сервере не нужен).

```powershell
# из корня репозитория сайта, PowerShell
npm run articles:build                     # пересобрать статьи из источника
. ".\vps door\load-ssh-env.ps1"            # загрузить SSH-доступ (ключ/хост/юзер)
powershell -File scripts\deploy_vernatun_to_vps.ps1
```

Скрипт сам зальёт `articles/`, `articles.html`, `js/site.js`, `public/sitemap.xml`
и прочее, прогонит nginx-install и health-check (`https://vernatunspeakclub.com/`).
После деплоя проверить: `/articles` и одну статью `/articles/<slug>`.

> Перед первым прод-коммитом добавить в git новые файлы: `scripts/articles/`, `content/`
> (если держим дефолтный источник в этом репо), `package.json`, `docs/ARTICLES_*`.
> На сам scp-деплой это не влияет, но нужно для воспроизводимости.

## B. Постоянный цикл: статья от агента → на сайт

Источник статей — **внешний GitHub-репозиторий** (куда пишет агент). Генератор читает его
через переменную `ARTICLES_SRC`.

```powershell
# 1. один раз: клонировать репозиторий статей рядом с сайтом
git clone <URL репозитория статей> ../vernatun-articles

# --- далее каждый цикл публикации ---
# 2. забрать свежие черновики агента
git -C ../vernatun-articles pull

# 3. навести генератор на внешний источник
$env:ARTICLES_SRC = "..\vernatun-articles\articles"

# 4. предпросмотр (рендерит и черновики) и ревью
npm run articles:preview
python scripts/dev_server.py        # http://127.0.0.1:8080/articles

# 5. АПРУВ: у понравившихся статей выставить status: published
#    (правим в ../vernatun-articles/articles/<slug>.md и коммитим в репо статей)
git -C ../vernatun-articles commit -am "approve: <slug>"

# 6. финальная сборка только published + деплой
npm run articles:build
. ".\vps door\load-ssh-env.ps1"
powershell -File scripts\deploy_vernatun_to_vps.ps1
```

Гейт апрува (шаг 5) остаётся за человеком — агент сам в `published` не переводит.

## C. Расписание (Claude scheduled task)

Агент-автор запускается по расписанию в своём чате и за прогон кладёт **один черновик**
в репозиторий статей (см. `docs/ARTICLES_AGENT_BRIEF.md`). Раз в неделю/период человек
проходит цикл B (ревью → апрув → деплой). Расписание само не публикует и не деплоит.

## D. Полезные команды

| Команда | Что делает |
|---------|-----------|
| `npm run articles:list` | статусы всех статей источника |
| `npm run articles:validate` | проверка полей/slug/длин/кодировки |
| `npm run articles:preview` | сборка включая черновики (для ревью) |
| `npm run articles:build` | сборка только published (для прода) |
| `npm run articles:publish -- --slug <s>` | перевод draft→published (апрув) |
