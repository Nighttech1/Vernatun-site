# Guards — C-114 Scenario turn timer

1. На доске `.board-timer`; Старт → label содержит «идёт», sec тикает вниз.
2. Сброс → снова 01:00 (60 с), без «идёт».
3. Sync: `timer.start` / `timer.reset` через DataChannel.
4. Shot: `visual/after-board-timer-lexicon.png`
