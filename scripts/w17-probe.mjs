import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
const q = await p.evaluate(() => {
  const el = document.querySelector(".film-quote");
  const cs = getComputedStyle(el);
  return { fs: cs.fontSize, fw: cs.fontWeight, text: el.textContent.trim() };
});
const cards = await p.evaluate(() => [...document.querySelectorAll("#formats .dest-card")].map(c => ({
  title: c.querySelector("h3")?.textContent?.trim(),
  desc: c.querySelector("p")?.textContent?.trim(),
  img: c.querySelector("img")?.getAttribute("src"),
})));
console.log({ q, cards });
await p.screenshot({ path: "memory/client-review/shots/w17-formats.png", fullPage: false });
await b.close();
