# C-258 guards

1. `cli.mjs new` создаёт валидный скелет черновика (status: draft). PASS.
2. `cli.mjs validate` зелёный на всех 4 файлах; негативные кейсы (битый slug/пустой title/дубль slug/сырой <script>) → ненулевой код.
3. `cli.mjs publish` переводит draft→published и отклоняет невалидную статью (гейт человека). PASS.
4. `cli.mjs list` показывает статус+дату+slug.
5. npm-скрипты `articles:new|validate|list|publish|build|preview` заданы в `package.json`.
6. Схема и домашний стиль задокументированы в `content/README.md`; `ARTICLES_SRC` — точка внешнего репо.
