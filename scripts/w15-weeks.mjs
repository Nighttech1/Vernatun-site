import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const weeks = await p.evaluate(() => {
  const grid = document.querySelector("#calendar .grid.grid-cols-7.bg-mist\\/40, #calendar .grid.grid-cols-7.bg-mist\\/40");
  // all day cells in order
  const cells = [...document.querySelectorAll("#calendar .cal-day")];
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7).map((c) => {
      const n = c.querySelector("span")?.textContent?.trim();
      const inMonth = !c.className.includes("bg-parchment");
      return (inMonth ? "" : "(") + n + (inMonth ? "" : ")");
    }));
  }
  return rows;
});
console.log(weeks.map((r,i) => "W"+i+": "+r.join(" ")).join("\n"));
await p.screenshot({ path: "memory/client-review/shots/w15-cal-full.png" });
await b.close();
