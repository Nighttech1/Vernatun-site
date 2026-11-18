# Chain — W-32 (C-82, C-83, C-84)

1. **Архитектор** — multi-speak в ARCHITECTURE + DEVELOPMENT_PLAN фазы 0; spec (этот файл)  
2. **Realtime** + **Деплоер** — `liverooms/infra` LiveKit + coturn compose, `.env.example`, meet smoke page  
3. **Тестировщик** — health check + guards.md  
4. **Фиксер** — до зелёного health  
5. **Деплоер** — localhost сервисы подняты для проверки Клиентом  
6. **Клиент** — вердикт по фазам 0–1  

Параллелить C-83/C-84 на одних compose-файлах — один проход Realtime.  
Frontend / Motion / AI Bridge — **не** звать.
