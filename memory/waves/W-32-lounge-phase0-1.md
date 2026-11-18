# Волна W-32 — Vernatun Lounge фазы 0–1

**before_sha:** n/a (не git-primary для данных)  
**Тикеты (≤3):** C-82, C-83, C-84  
**Профиль:** Vernatun Lounge · `livekit-voice-rooms`

## Цель волны

1. Канон: **несколько человек говорят одновременно**, все слышат всех (Discord Voice / TeamSpeak), не Stage «один спикер».
2. Фаза 0: решения зафиксированы.
3. Фаза 1: LiveKit + TURN на localhost Docker; dual-peer путь проверки.

## Chain (Архитектор → …)

См. `memory/tickets/C-82-lounge-multispeak-phase0/chain.md` (общая на волну).

## Статус

infra_up · health_ok · meet_token_ok · **ожидает ручной dual-peer звук от Клиента**

## Localhost URLs

- LiveKit: `http://127.0.0.1:7880` (ws `ws://127.0.0.1:7880`)
- Meet smoke: `http://127.0.0.1:8765/?as=a` и `http://127.0.0.1:8765/?as=b`
- coturn: `3478`
