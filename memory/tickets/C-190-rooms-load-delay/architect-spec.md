# Architect-spec W-62

## C-190 Rooms delay
- `livekit_online_cached(room_id, ttl=8)`
- `online_map_for_rooms(ids)` — один LiveKitAPI + gather list_participants
- GET /rooms uses map; FE can keep 12s poll

## C-191 Admin sections
- Tab «Жалобы»: inbox items kind=report
- Tab «Модерация»: inbox kinds alert|toxicity_ai + moderation.log rows (unified list with source badge)
- Tab «Баны»: unchanged API

## C-192 List chrome
- `.list-scroll` max-height; toolbar: search input, sort select (date|name|ip), filter chips

## C-193 Privacy rewrite (human RU, no jargon)

## C-194 NonameN in lounge_api next_ahperik → next_noname

## C-195 Board upload hint + 30MB check
