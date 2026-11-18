import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const overflow = await p.evaluate(() => {
  return [...document.querySelectorAll(".cal-pill")].map((el) => ({
    text: el.textContent.trim(),
    overflow: el.scrollWidth > el.clientWidth + 1,
    fs: getComputedStyle(el).fontSize,
    cw: el.clientWidth,
    sw: el.scrollWidth,
  }));
});
console.log("OVERFLOW", overflow.filter(x => x.overflow));
console.log("ALL_OK", overflow.every(x => !x.overflow));
// click dance on 13
await p.locator(".cal-day").filter({ has: p.locator("span", { hasText: /^13$/ }) }).locator(".cal-pill", { hasText: "Танцы" }).click();
await p.waitForTimeout(400);
const card13 = await p.evaluate(() => ({
  date: document.querySelector("#calendar aside p.text-right")?.textContent,
  title: document.querySelector("#calendar aside h3")?.textContent,
}));
console.log("CARD13", card13);
await b.close();
