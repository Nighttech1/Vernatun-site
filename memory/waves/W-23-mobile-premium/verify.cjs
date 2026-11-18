const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const out = "E:/Applications/Vernatun/memory/waves/W-23-mobile-premium/after";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const [name, device] of [
    ["iphone15", devices["iPhone 15"]],
    ["pixel7", devices["Pixel 7"]],
  ]) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();

    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(out, name + "-home.png") });
    const header = await page.evaluate(() => {
      const brand = document.querySelector(".site-brand-name");
      const link = document.querySelector(".site-brand-link");
      const cta = document.querySelector(".site-cta");
      const br = brand ? getComputedStyle(brand).display : "missing";
      const lr = link.getBoundingClientRect();
      const cr = cta.getBoundingClientRect();
      return {
        brandDisplay: br,
        brandLinkH: Math.round(lr.height),
        ctaH: Math.round(cr.height),
        gap: Math.round(cr.left - (document.querySelector(".site-brand-link").getBoundingClientRect().right)),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    await page.evaluate(() => document.querySelector("#formats")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, name + "-formats.png") });
    const formats = await page.evaluate(() => {
      const p = document.querySelector("#formats .dest-card-body p");
      return p ? { op: getComputedStyle(p).opacity, h: Math.round(p.getBoundingClientRect().height) } : null;
    });

    await page.goto("http://127.0.0.1:8080/schedule.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, name + "-schedule.png") });
    const cal = await page.evaluate(() => {
      const btns = [...document.querySelectorAll(".cal-month-nav")].map((el) => {
        const r = el.getBoundingClientRect();
        return { h: Math.round(r.height), w: Math.round(r.width) };
      });
      const pills = [...document.querySelectorAll(".cal-pill")].slice(0, 3).map((el) => Math.round(el.getBoundingClientRect().height));
      return { btns, pills };
    });

    await page.goto("http://127.0.0.1:8080/materials/podcasts/ideal-life/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(out, name + "-podcast.png") });
    const podcast = await page.evaluate(() => {
      const card = document.querySelector(".pdf-mobile-card");
      const iframe = document.querySelector("iframe.pdf-frame");
      const open = card && card.querySelector("a");
      return {
        cardVisible: card && getComputedStyle(card).display !== "none",
        iframeDisplay: iframe && getComputedStyle(iframe).display,
        openH: open ? Math.round(open.getBoundingClientRect().height) : 0,
        audio: !!document.querySelector("audio"),
      };
    });

    // menu + atmosphere regression
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.locator('button[aria-label="Открыть меню"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, name + "-menu.png") });
    const menu = await page.evaluate(() => ({
      bg: getComputedStyle(document.querySelector(".site-mobile-drawer")).backgroundColor,
      brand: getComputedStyle(document.querySelector(".site-brand-name") || document.body).color,
    }));

    results[name] = { header, formats, cal, podcast, menu };
    await context.close();
  }

  fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
