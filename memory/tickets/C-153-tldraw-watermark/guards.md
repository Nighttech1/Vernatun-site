# Guards — C-153 tldraw watermark

## Правило
Не скрывать watermark CSS/`display:none`. Только `licenseKey` на `<Tldraw />` из `VITE_TLDRAW_LICENSE_KEY`.

## Pass
- В `.env.local` есть непустой `VITE_TLDRAW_LICENSE_KEY`
- На доске нет watermark / нет hint «нужен license»
- tsc / smoke комнаты зелёные

## Fail (открыт)
- Ключа нет → watermark или hint в meta допустим; тикет НЕ done
