const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const out = "E:/Applications/Vernatun/memory/waves/W-23-mobile-premium/final";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const issues = [];

  for (const [devName, device] of [
    ["iphone15", devices["iPhone 15"]],
    ["pixel7", devices["Pixel 7"]],
  ]) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    const pages = [
      "http://127.0.0.1:8080/",
      "http://127.0.0.1:8080/schedule.html",
      "http://127.0.0.1:8080/contacts.html",
      "http://127.0.0.1:8080/materials.html",
      "http://127.0.0.1:8080/articles.html",
      "http://127.0.0.1:8080/materials/podcasts/ideal-life/index.html",
    ];
    for (const url of pages) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(700);
      const m = await page.evaluate(() => {
        const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        const touchNone = [...document.querySelectorAll("*")].some((el) => {
          if (getComputedStyle(el).touchAction !== "none") return false;
          const r = el.getBoundingClientRect();
          return r.width > 200 && r.height > 200;
        });
        return { overflowX, touchNone, title: document.title };
      });
      if (m.overflowX) issues.push(devName + " overflow " + url);
      if (m.touchNone) issues.push(devName + " touchNone " + url);
    }

    // home specific
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    await page.locator('button[aria-label="Открыть меню"]').click();
    await page.waitForTimeout(400);
    const menuOk = await page.evaluate(() => {
      const d = document.querySelector(".site-mobile-drawer");
      return d && getComputedStyle(d).backgroundColor.includes("249");
    });
    if (!menuOk) issues.push(devName + " menu bg");
    await page.screenshot({ path: path.join(out, devName + "-menu.png") });
    await page.locator('button[aria-label="Открыть меню"]').click();

    await page.evaluate(() => document.querySelector("#formats")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(500);
    const fmt = await page.evaluate(() => {
      const p = document.querySelector("#formats .dest-card-body p");
      return p && Number(getComputedStyle(p).opacity) >= 0.9 && p.getBoundingClientRect().height > 30;
    });
    if (!fmt) issues.push(devName + " formats desc");
    await page.screenshot({ path: path.join(out, devName + "-formats.png") });

    await page.evaluate(() => document.querySelector("#atmosphere")?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);
    const atm = await page.evaluate(() => getComputedStyle(document.querySelector(".circular-sticky")).touchAction);
    if (atm === "none") issues.push(devName + " circular none");
    await page.screenshot({ path: path.join(out, devName + "-atm.png") });

    await page.goto("http://127.0.0.1:8080/schedule.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const cal = await page.evaluate(() => {
      const nav = [...document.querySelectorAll(".cal-month-nav")].every((el) => el.getBoundingClientRect().height >= 44);
      const pills = [...document.querySelectorAll(".cal-pill")].slice(0, 5).every((el) => el.getBoundingClientRect().height >= 44);
      return nav && pills;
    });
    if (!cal) issues.push(devName + " cal taps");
    await page.screenshot({ path: path.join(out, devName + "-schedule.png") });

    await page.goto("http://127.0.0.1:8080/contacts.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    const contact = await page.evaluate(() => {
      const o = document.querySelector(".mag-open");
      return o && o.getBoundingClientRect().height >= 44;
    });
    if (!contact) issues.push(devName + " contact open");
    await page.screenshot({ path: path.join(out, devName + "-contacts.png") });

    await page.goto("http://127.0.0.1:8080/materials/podcasts/ideal-life/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const pod = await page.evaluate(() => {
      const card = document.querySelector(".pdf-mobile-card");
      const a = card && card.querySelector("a");
      return card && getComputedStyle(card).display !== "none" && a && a.getBoundingClientRect().height >= 44;
    });
    if (!pod) issues.push(devName + " podcast pdf");
    await page.screenshot({ path: path.join(out, devName + "-podcast.png") });

    await context.close();
  }

  fs.writeFileSync(path.join(out, "issues.json"), JSON.stringify({ issues, ok: issues.length === 0 }, null, 2));
  console.log(JSON.stringify({ issues, ok: issues.length === 0 }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
