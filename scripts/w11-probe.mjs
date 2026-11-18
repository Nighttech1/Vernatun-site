import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(2500);
const video = await p.evaluate(() => {
  const v = document.querySelector(".film-video");
  return v ? {
    src: (v.currentSrc || v.src).split("/").pop(),
    loop: v.loop,
    dataStart: v.getAttribute("data-loop-start"),
    t: Number(v.currentTime.toFixed(2)),
    paused: v.paused,
    dur: v.duration && isFinite(v.duration) ? Number(v.duration.toFixed(1)) : null,
  } : null;
});
console.log("VIDEO", video);
await p.screenshot({ path: path.join(OUT, "w11-hero-video.png") });
const revealTop = await p.evaluate(() => {
  const cards = [...document.querySelectorAll("#formats .dest-card")];
  return {
    withReveal: cards.filter((c) => c.classList.contains("reveal")).length,
    visible: cards.filter((c) => c.classList.contains("reveal-visible")).length,
  };
});
console.log("REVEAL_AT_TOP", revealTop);
await p.evaluate(() => window.scrollTo(0, document.querySelector("#formats").offsetTop - 80));
await p.waitForTimeout(1000);
console.log("REVEAL_MID", await p.evaluate(() => ({
  visible: [...document.querySelectorAll("#formats .dest-card.reveal-visible")].length,
})));
await p.screenshot({ path: path.join(OUT, "w11-formats-reveal.png") });
await b.close();
