# Guards — C-147 OCR → lexicon

1. Button «Рамка → словарь» enables overlay on board.
2. After rect + text (OCR or manual) → «Добавить в словарь» publishes `lexicon.add`.
3. `POST /api/lounge/ai/translate` returns hy/phonetic/ru (degraded OK).
4. Lexicon tab shows new card.
