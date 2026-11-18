import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const overflow = await p.evaluate(() => [...document.querySelectorAll(".cal-pill")].every(el => el.scrollWidth <= el.clientWidth + 1));
const days = await p.evaluate(() => {
  function dayEvents(n) {
    for (const cell of document.querySelectorAll(".cal-day")) {
      const span = cell.querySelector("span");
      if (!span || span.textContent.trim() !== String(n)) continue;
      if (span.className.includes("text-azure/35")) continue;
      return [...cell.querySelectorAll(".cal-pill")].map(b => b.textContent.trim());
    }
    return [];
  }
  return { d3: dayEvents(3), d10: dayEvents(10), d13: dayEvents(13), d26: dayEvents(26), d27: dayEvents(27) };
});
console.log({ overflow, days });
await p.screenshot({ path: "memory/client-review/shots/w15-cal-fixed.png" });
await b.close();
