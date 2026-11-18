import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
async function titleLeft(url) {
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);
  return p.evaluate(() => {
    const h = document.querySelector("h1");
    const cta = document.querySelector("a.site-cta");
    return {
      hLeft: Math.round(h.getBoundingClientRect().left),
      ctaRight: Math.round(cta.getBoundingClientRect().right),
      maxW: getComputedStyle(h.closest("div.mx-auto")).maxWidth,
    };
  });
}
const pages = {
  schedule: await titleLeft("http://127.0.0.1:8765/schedule.html?t="+Date.now()),
  materials: await titleLeft("http://127.0.0.1:8765/materials.html?t="+Date.now()),
  articles: await titleLeft("http://127.0.0.1:8765/articles.html?t="+Date.now()),
  contacts: await titleLeft("http://127.0.0.1:8765/contacts.html?t="+Date.now()),
};
console.log("TITLES", pages);

await p.goto("http://127.0.0.1:8765/schedule.html?t="+Date.now(), { waitUntil: "domcontentloaded" });
await p.waitForTimeout(700);
const pill = await p.evaluate(() => {
  const el = [...document.querySelectorAll(".cal-pill")].find(b => b.textContent.includes("Разговорный"));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    text: el.textContent.trim(),
    scrollW: el.scrollWidth,
    clientW: el.clientWidth,
    fits: el.scrollWidth <= el.clientWidth + 1,
    cellW: el.closest(".cal-cell")?.getBoundingClientRect().width,
  };
});
console.log("PILL", pill);
const meta = await p.evaluate(() => {
  const d = document.querySelector("header")._x_dataStack?.[0];
  // read from selected card
  const title = document.querySelector("aside h3")?.textContent.trim();
  const desc = document.querySelector("aside p.text-sm")?.textContent.trim();
  return { title, desc: desc?.slice(0, 80) };
});
console.log("CARD", meta);

await p.goto("http://127.0.0.1:8765/?t="+Date.now(), { waitUntil: "domcontentloaded" });
await p.waitForTimeout(500);
const leads = await p.evaluate(() => ({
  formats: document.querySelector("#formats p.max-w-2xl")?.textContent.trim(),
  atm: document.querySelector(".atmosphere-lead")?.textContent.trim(),
  footerLogo: !!document.querySelector(".site-footer-logo"),
  footerName: [...document.querySelectorAll(".site-footer-brand p")].map(p=>p.textContent.trim()),
}));
console.log("COPY", leads);
await p.screenshot({ path: path.join(OUT, "w12-footer.png"), fullPage: false });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(400);
await p.screenshot({ path: path.join(OUT, "w12-footer-bottom.png") });
await p.goto("http://127.0.0.1:8765/schedule.html");
await p.waitForTimeout(500);
await p.screenshot({ path: path.join(OUT, "w12-schedule.png") });
await b.close();
