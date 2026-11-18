import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(1800);
const home = await p.evaluate(() => {
  const brand = document.querySelector(".site-brand-name");
  const strong = document.querySelector(".film-mark strong");
  const em = document.querySelector(".film-mark em");
  const atm = document.querySelector(".atmosphere-section");
  const h1 = document.querySelector("#club h1");
  const body = getComputedStyle(document.body);
  return {
    brand: brand?.textContent?.trim(),
    brandFs: brand && getComputedStyle(brand).fontSize,
    strongFs: strong && getComputedStyle(strong).fontSize,
    strongTransform: strong && getComputedStyle(strong).transform,
    emFs: em && getComputedStyle(em).fontSize,
    atmBg: atm && getComputedStyle(atm).backgroundColor,
    h1Fs: h1 && getComputedStyle(h1).fontSize,
    bodyFs: body.fontSize,
    pFs: document.querySelector("#club p") && getComputedStyle(document.querySelector("#club p")).fontSize,
  };
});
console.log("HOME", home);
await p.screenshot({ path: path.join(OUT, "w14-home.png") });
await p.goto("http://127.0.0.1:8765/schedule.html?t=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(1200);
const sch = await p.evaluate(() => {
  const grid = document.querySelector("#calendar .grid.items-stretch");
  const aside = document.querySelector("#calendar aside");
  const cta = document.querySelector("#calendar a.bg-terracotta, #calendar a[href*='MASClubb']");
  const headerCta = document.querySelector("a.site-cta");
  const asideBox = aside?.getBoundingClientRect();
  const headerBox = headerCta?.getBoundingClientRect();
  return {
    gridClass: grid?.className,
    asideW: asideBox ? Math.round(asideBox.width) : null,
    asideRight: asideBox ? Math.round(asideBox.right) : null,
    headerCtaRight: headerBox ? Math.round(headerBox.right) : null,
    ctaText: cta?.textContent?.trim(),
    brand: document.querySelector(".site-brand-name")?.textContent?.trim(),
  };
});
console.log("SCHEDULE", sch);
await p.screenshot({ path: path.join(OUT, "w14-schedule.png") });
await b.close();
