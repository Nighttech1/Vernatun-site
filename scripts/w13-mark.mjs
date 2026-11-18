import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(2500);
const mark = await p.evaluate(() => {
  const s = document.querySelector(".film-mark strong");
  const e = document.querySelector(".film-mark em");
  const sr = s.getBoundingClientRect();
  const er = e.getBoundingClientRect();
  return {
    strongW: Math.round(sr.width),
    emW: Math.round(er.width),
    strongRight: Math.round(sr.right),
    emRight: Math.round(er.right),
    diff: Math.abs(sr.width - er.width),
    sTransform: getComputedStyle(s).transform,
    eTransform: getComputedStyle(e).transform,
  };
});
console.log("MARK_AFTER_SCALEX", mark);
await p.screenshot({ path: "memory/client-review/shots/w13-hero-mark.png", clip: { x: 0, y: 700, width: 420, height: 200 } });
await b.close();
