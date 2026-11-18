import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const gal = await p.evaluate(async () => {
  const imgs = [...document.querySelectorAll(".circular-item img, .circular-fallback img")];
  const results = [];
  for (const img of imgs) {
    const src = img.getAttribute("src");
    let ok = false, status = null;
    try {
      const r = await fetch(src, { method: "HEAD" });
      status = r.status;
      ok = r.ok;
    } catch (e) { status = String(e); }
    results.push({ src, ok, status, natural: img.naturalWidth });
  }
  return results;
});
console.log("GALLERY", gal);
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.locator(".cal-pill", { hasText: "Танцы" }).first().click();
await p.waitForTimeout(400);
const dance = await p.evaluate(() => {
  const img = document.querySelector("#calendar aside img.event-card-photo");
  return { src: img?.src, w: img?.naturalWidth, h: img?.naturalHeight };
});
console.log("DANCE", dance);
await b.close();
