import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

async function pick(label) {
  await p.locator(".cal-pill", { hasText: label }).first().click();
  await p.waitForTimeout(350);
  return p.evaluate(() => ({
    title: document.querySelector("#calendar aside h3")?.textContent?.trim(),
    src: document.querySelector("#calendar aside img.event-card-photo")?.getAttribute("src"),
    date: document.querySelector("#calendar aside p.text-right")?.textContent?.trim(),
  }));
}

const talk = await pick("Разговорный");
const volley = await pick("Волейбол");
const dance = await pick("Танцы");

const days = await p.evaluate(() => {
  function dayEvents(n) {
    for (const cell of document.querySelectorAll(".cal-day")) {
      const span = cell.querySelector("span");
      if (!span || span.textContent.trim() !== String(n)) continue;
      if (span.className.includes("text-azure/35")) continue;
      return [...cell.querySelectorAll(".cal-pill")].map((b) => b.textContent.trim());
    }
    return [];
  }
  return { d12: dayEvents(12), d13: dayEvents(13), d26: dayEvents(26) };
});

console.log({ talk, volley, dance, days });

// click dance on 13 specifically
await p.locator(".cal-day").filter({ has: p.locator("span", { hasText: /^13$/ }) }).locator(".cal-pill", { hasText: "Танцы" }).click();
await p.waitForTimeout(400);
await p.screenshot({ path: path.join(OUT, "w16-dance-card.png") });
await p.locator(".cal-pill", { hasText: "Волейбол" }).first().click();
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(OUT, "w16-volley-card.png") });
await p.locator(".cal-pill", { hasText: "Разговорный" }).first().click();
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(OUT, "w16-talk-card.png") });
await b.close();
