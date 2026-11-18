# C-247 done

- Root cause of huge gap + thin rounded bar: `.inbox-layout { display:grid }` overrode `[hidden]` — empty list-scroll still painted under Настройки. Fixed with `[hidden]{display:none!important}` + `.inbox.is-settings` kill-switch.
- Tabs→help spacing tightened; panel min-height cleared on settings.
- Keywords/patterns: buttons «Ключевые слова» / «Шаблоны» → large modal editor (Save closes into draft; server via «Сохранить образцы»).
- Files: `liverooms/admin/styles.css`, `liverooms/admin/app.js`, `liverooms/admin/index.html`
