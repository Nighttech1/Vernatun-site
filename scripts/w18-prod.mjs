import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://vernatunspeakclub.com/?t=" + Date.now(), { waitUntil: "networkidle", timeout: 90000 });
await p.waitForTimeout(2500);
const home = await p.evaluate(async () => {
  const quote = document.querySelector(".film-quote")?.textContent?.trim();
  const gal = [];
  for (const src of ["/gallery/1.jpg","/gallery/2.jpg","/gallery/3.jpg","/gallery/7.jpg","/gallery/8.jpg"]) {
    const r = await fetch(src, { method: "HEAD" });
    gal.push({ src, ok: r.ok, status: r.status });
  }
  const css = await fetch("/css/site.css", { method: "HEAD" });
  const js = await fetch("/js/site.js", { method: "HEAD" });
  const video = await fetch("/images/header-bg.mp4", { method: "HEAD" });
  return { quote, gal, css: css.status, js: js.status, video: video.status };
});
console.log("HOME", JSON.stringify(home, null, 2));
await p.goto("https://vernatunspeakclub.com/schedule.html?t=" + Date.now(), { waitUntil: "networkidle", timeout: 90000 });
await p.waitForTimeout(1500);
await p.locator(".cal-pill", { hasText: "Танцы" }).first().click();
await p.waitForTimeout(500);
const dance = await p.evaluate(() => {
  const img = document.querySelector("#calendar aside img.event-card-photo");
  return { src: img?.getAttribute("src"), w: img?.naturalWidth, title: document.querySelector("#calendar aside h3")?.textContent };
});
console.log("DANCE", dance);
await p.screenshot({ path: "memory/client-review/shots/w18-prod-home.png" });
await b.close();
