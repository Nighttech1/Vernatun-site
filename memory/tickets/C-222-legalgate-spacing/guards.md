# Guards C-222 — LegalGate consent: line-height / spacing

## Executable checks
1. `.legal-gate-disclaimer p` line-height ≈ **1.45–1.6** (measured ~1.55).
2. `.legal-gate-check` line-height ≥ ~1.55 (measured ~1.65).
3. Vertical gap: disclaimer `margin-bottom` / check `margin-top` ≥ ~0.75rem (~12px); measured check margin-top 13.6px.
4. Legal copy meaning unchanged.
5. Shots: `memory/waves/W-66-shots/legalgate-desktop.png`, `legalgate-iphone-390.png`.

## Permanent
- Consent block stays readable; no cramped line-height regression.

## Regression
- Do not collapse disclaimer/checkbox gaps below ~0.75rem.

## Smoke (W-66)
```
# evaluate LegalGate: disclaimerLH≈1.55, checkLH≈1.65, noHScroll on 390
```

## Verdict W-66 Tester
**PASS**
