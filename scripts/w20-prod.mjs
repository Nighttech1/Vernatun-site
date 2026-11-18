import { chromium, devices } from "playwright";
const iPhone = devices["iPhone 12"];
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ ...iPhone });
const p = await ctx.newPage();
await p.goto("https://vernatunspeakclub.com/schedule.html?t=" + Date.now(), { waitUntil: "networkidle", timeout: 90000 });
await p.waitForTimeout(1500);
const pill = await p.evaluate(() => {
  const talk = [...document.querySelectorAll(".cal-pill")].find((el) => /Разговорн/.test(el.textContent));
  const cs = getComputedStyle(talk);
  return { text: JSON.stringify(talk.textContent), ws: cs.whiteSpace, h: Math.round(talk.getBoundingClientRect().height) };
});
console.log("PROD_PILL", pill);
await p.goto("https://vernatunspeakclub.com/?t=" + Date.now(), { waitUntil: "networkidle", timeout: 90000 });
await p.locator('button[aria-label="Открыть меню"]').click();
await p.waitForTimeout(400);
const menu = await p.evaluate(() => {
  const s = document.querySelector(".site-mobile-section");
  const l = document.querySelector(".site-mobile-link");
  return { s: parseFloat(getComputedStyle(s).fontSize), l: parseFloat(getComputedStyle(l).fontSize), ok: parseFloat(getComputedStyle(s).fontSize) > parseFloat(getComputedStyle(l).fontSize) };
});
console.log("PROD_MENU", menu);
await p.screenshot({ path: "memory/client-review/shots/w20-prod-menu.png" });
await b.close();
