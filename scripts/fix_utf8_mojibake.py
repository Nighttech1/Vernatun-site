#!/usr/bin/env python3
from pathlib import Path
import ftfy

ROOT = Path(r"e:\Applications\Vernatun")
SKIP = {"node_modules", ".git", "stitch_armenian_club_brandbook"}
MARKERS = ("Рћ", "Рў", "Р’", "Рџ", "вЂ")


def main() -> None:
    n = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(p in path.parts for p in SKIP):
            continue
        if path.suffix.lower() not in {".html", ".htm", ".md", ".xml", ".txt"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue
        if not any(m in text for m in MARKERS):
            continue
        fixed = ftfy.fix_text(text)
        # Prefer latin-1 roundtrip if ftfy insufficient
        if any(m in fixed for m in MARKERS):
            try:
                alt = text.encode("cp1252").decode("utf-8")
                if not any(m in alt for m in MARKERS):
                    fixed = alt
            except Exception:
                try:
                    alt = text.encode("latin-1").decode("utf-8")
                    if not any(m in alt for m in MARKERS):
                        fixed = alt
                except Exception:
                    pass
        if fixed == text:
            print("UNCHANGED", path.relative_to(ROOT))
            continue
        if any(m in fixed for m in MARKERS) and "О нашем" not in fixed and "Вернатун" not in fixed[:5000]:
            print("STILL_BAD", path.relative_to(ROOT))
            continue
        path.write_bytes(fixed.encode("utf-8"))
        n += 1
        print("FIXED", path.relative_to(ROOT))
    print("TOTAL", n)
    # sanity
    idx = (ROOT / "index.html").read_text(encoding="utf-8")
    print("SANITY О нашем", "О нашем клубе" in idx)
    print("SANITY Дом", "Дом" in idx)


if __name__ == "__main__":
    main()
