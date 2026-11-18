# W-13 — video 1:41 + type/mark

| Ticket | Result |
|--------|--------|
| C-35 | Re-encode `-ss 00:01:41` → `images/header-bg.mp4` (~38.9s). JS loop via seek on ended/timeupdate. |
| C-36 | `fitFilmMarkWidths()` equalizes Vernatun / subtitle; CSS + `ensureBrandCss` force 12 body / 16 headings. |

Chain: Architect → Frontend → Tester → Fixer → Deployer → Client  
Localhost: http://127.0.0.1:8765/
