import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(1500);

const data = await p.evaluate(() => {
  const title = document.querySelector("#calendar h3.font-display")?.textContent?.trim()
    || document.querySelector("[x-text='title']")?.textContent;
  // Alpine title is on h3 with x-text="title"
  const monthTitle = [...document.querySelectorAll("#calendar h3")].map(el => el.textContent.trim()).find(Boolean);
  const pills = [...document.querySelectorAll(".cal-pill")].map((el) => {
    const r = el.getBoundingClientRect();
    const overflow = el.scrollWidth > el.clientWidth + 1;
    return { text: el.textContent.trim(), fs: getComputedStyle(el).fontSize, w: Math.round(r.width), sw: el.scrollWidth, overflow };
  });
  const talkPills = pills.filter((x) => x.text.includes("Разговорный"));
  const card = {
    hasCta: !!document.querySelector("#calendar a.bg-terracotta"),
    hasSiblings: !!document.querySelector("#calendar aside .flex.flex-wrap.gap-2 button"),
    hasBadge: !!document.querySelector("#calendar aside .rounded-full.px-2\\.5, #calendar aside span.uppercase"),
    dateAlign: (() => {
      const el = document.querySelector("#calendar aside p.text-right");
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { text: el.textContent.trim(), textAlign: cs.textAlign };
    })(),
    h3: document.querySelector("#calendar aside h3")?.textContent?.trim(),
    desc: document.querySelector("#calendar aside p.text-sm")?.textContent?.trim()?.slice(0, 40),
  };
  // collect events by clicking through or from alpine - scrape pills per day
  const byDay = {};
  document.querySelectorAll(".cal-day").forEach((cell) => {
    const day = cell.querySelector("span")?.textContent?.trim();
    const labels = [...cell.querySelectorAll(".cal-pill")].map((b) => b.textContent.trim());
    if (labels.length) byDay[day] = labels;
  });
  return {
    monthTitle,
    talkOverflow: talkPills.filter((x) => x.overflow).length,
    talkSample: talkPills[0],
    pillCount: pills.length,
    card,
    byDay,
  };
});
console.log(JSON.stringify(data, null, 2));

// Verify expected Sept 2026 keys via page evaluate of build if exposed - recompute
const expected = await p.evaluate(() => {
  // scrape from DOM for days 13 and 26
  function dayEvents(n) {
    const cells = [...document.querySelectorAll(".cal-day")];
    for (const cell of cells) {
      const daySpan = cell.querySelector("span");
      if (!daySpan) continue;
      if (daySpan.textContent.trim() === String(n) && !cell.className.includes("bg-parchment")) {
        // in-month check: not faded
        const muted = daySpan.className.includes("text-azure/35");
        if (muted) continue;
        return [...cell.querySelectorAll(".cal-pill")].map((b) => b.textContent.trim());
      }
    }
    return null;
  }
  return {
    d10: dayEvents(10),
    d12: dayEvents(12),
    d13: dayEvents(13),
    d14: dayEvents(14),
    d20: dayEvents(20),
    d26: dayEvents(26),
    d27: dayEvents(27),
  };
});
console.log("DAYS", expected);

await p.screenshot({ path: path.join(OUT, "w15-schedule.png"), fullPage: false });
// zoom pills area
const cal = await p.locator("#calendar .overflow-hidden.rounded-xl").first().boundingBox();
if (cal) {
  await p.screenshot({ path: path.join(OUT, "w15-pills.png"), clip: { x: cal.x, y: cal.y, width: Math.min(cal.width, 900), height: Math.min(cal.height, 520) } });
}
const aside = await p.locator("#calendar aside").boundingBox();
if (aside) {
  await p.screenshot({ path: path.join(OUT, "w15-card.png"), clip: aside });
}
await b.close();
