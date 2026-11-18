import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "networkidle" });
const hero = await p.evaluate(() => {
  const q = document.querySelector(".film-quote");
  const mark = document.querySelector(".film-mark");
  const cs = q ? getComputedStyle(q) : null;
  return {
    quote: q?.textContent.trim(),
    hasMoskva: q?.textContent.includes("Москва"),
    mark: mark?.innerText.replace(/\n/g, " | "),
    animDelay: cs?.animationDelay,
    opacityAtStart: cs?.opacity,
  };
});
console.log("HERO", hero);
await p.waitForTimeout(2000);
const after = await p.evaluate(() => getComputedStyle(document.querySelector(".film-quote")).opacity);
console.log("QUOTE_OPACITY_AFTER_2S", after);
await p.screenshot({ path: path.join(OUT, "w10-hero.png") });

const nav = await p.evaluate(() => {
  const labels = [...document.querySelectorAll(".site-nav-desk .site-nav-link span, .site-nav-desk > a.site-nav-link")].map(a => a.textContent.trim());
  const aboutLinks = [];
  // open about via hover simulation not here
  const faqInAbout = document.documentElement.innerHTML.includes("FAQ");
  const chevrons = document.querySelectorAll(".site-nav-desk svg").length;
  const plain = [...document.querySelectorAll(".site-nav-desk > a.site-nav-link")].filter(a => !a.querySelector("svg")).map(a => a.textContent.trim());
  return { chevrons, plain, faqInAbout };
});
console.log("NAV", nav);
await p.locator('a[data-nav=about]').hover();
await p.waitForTimeout(300);
const aboutMega = await p.evaluate(() => [...document.querySelectorAll(".site-mega-list a")].map(a => a.textContent.trim()));
console.log("ABOUT_MEGA", aboutMega);

const gal = await p.evaluate(() => {
  const n = document.querySelectorAll(".circular-item").length;
  const caps = document.querySelectorAll(".circular-cap").length;
  return { n, caps };
});
console.log("GAL", gal);

const faqN = await p.evaluate(() => document.querySelectorAll("#faq details.faq-item").length);
console.log("FAQ_COUNT", faqN);

await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(600);
const sched = await p.evaluate(() => {
  const intro = document.querySelector("#calendar .reveal p")?.textContent.trim();
  const legend = document.querySelectorAll(".cal-icon--talk, .cal-icon--ethnic").length;
  const pills = [...document.querySelectorAll(".cal-pill")].slice(0, 6).map(b => b.textContent.trim());
  const photoH = document.querySelector(".event-card-photo")?.getBoundingClientRect().height;
  return { intro, legend, pills, photoH };
});
console.log("SCHED", sched);
await p.screenshot({ path: path.join(OUT, "w10-schedule.png") });

await p.goto("http://127.0.0.1:8765/materials.html?t=" + Date.now(), { waitUntil: "networkidle" });
const align = await p.evaluate(() => {
  const h = document.querySelector("h1");
  const box = h.getBoundingClientRect();
  const parent = h.parentElement.getBoundingClientRect();
  return { leftish: Math.abs(box.left - parent.left) < 2, textAlign: getComputedStyle(h.parentElement).textAlign };
});
console.log("MATERIALS_ALIGN", align);
await b.close();
