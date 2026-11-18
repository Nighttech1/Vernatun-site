# Architect-spec — C-201

Разделить модалки:
- TermsOfServiceModal — полный Документ 1 (оферта), структурированный HTML (h2/h3, ol/ul, контакты).
- PrivacyPolicyModal — полный Документ 2; таблица категорий данных как `<table class="legal-table">`.

Стили в `room.css` `.terms-modal-body` — читаемые отступы, таблица.

Не менять LegalGate логику — только тексты по ссылкам.
