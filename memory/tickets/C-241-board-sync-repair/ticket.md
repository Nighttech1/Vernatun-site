### [C-241] Доска снова не синхронится (P0)
- **Факт:** каждый видит только свой рисунок
- **Ожидание:** общая доска; dual-browser smoke обязателен до приёмки
- **Причина (гипотеза):** persistenceKey IndexedDB + хрупкий diff/snapshot
- **Фикс:** без IDB в live-комнате; shape-level sync + snapshot on join
- **Зона:** Frontend
