# Guards — C-113 Shared Room Lexicon

1. `.board-phrase-hit` кликабельны в connected room.
2. После клика: вкладка Словарь показывает `.room-side-stub-word` = hy фразы; `.lexicon-list-item` ≥ 1.
3. DataChannel topic `vernatun`, type `lexicon.add`.
4. «В мой SRS» пишет в `localStorage` key `vernatun-srs-v1` (без wipe чужих данных).
