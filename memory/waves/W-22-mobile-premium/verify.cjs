const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const out = "E:/Applications/Vernatun/memory/waves/W-22-mobile-premium/after";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const [name, device] of [
    ["iphone15", devices["iPhone 15"]],
    ["pixel7", devices["Pixel 7"]],
  ]) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, name + "-home-hero.png") });

    const header = await page.evaluate(() => {
      const cta = document.querySelector(".site-cta");
      const r = cta.getBoundingClientRect();
      return { ctaH: Math.round(r.height), ctaW: Math.round(r.width) };
    });

    await page.evaluate(() => document.querySelector("#formats")?.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, name + "-formats.png") });
    const formats = await page.evaluate(() => {
      const p = document.querySelector("#formats .dest-card-body p");
      if (!p) return null;
      const cs = getComputedStyle(p);
      return {
        opacity: cs.opacity,
        maxHeight: cs.maxHeight,
        text: (p.textContent || "").trim().slice(0, 40),
        visibleH: Math.round(p.getBoundingClientRect().height),
      };
    });

    await page.goto("http://127.0.0.1:8080/contacts.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, name + "-contacts.png") });
    const contacts = await page.evaluate(() => {
      const open = document.querySelector(".mag-open");
      if (!open) return null;
      const r = open.getBoundingClientRect();
      return { h: Math.round(r.height), w: Math.round(r.width), text: open.textContent.trim() };
    });

    await page.goto("http://127.0.0.1:8080/materials.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, name + "-materials.png") });

    await page.goto("http://127.0.0.1:8080/schedule.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, name + "-schedule.png") });

    results[name] = { header, formats, contacts };
    await context.close();
  }

  fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
