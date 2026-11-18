const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const out = "E:/Applications/Vernatun/memory/waves/W-24-emergency/after";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const issues = [];

  for (const [n, d] of [
    ["iphone15", devices["iPhone 15"]],
    ["pixel7", devices["Pixel 7"]],
  ]) {
    const context = await browser.newContext({ ...d });
    const page = await context.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));

    await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, n + "-hero.png") });

    const brand = await page.evaluate(() => {
      const el = document.querySelector(".site-brand-name");
      return el ? { disp: getComputedStyle(el).display, text: el.textContent.trim() } : null;
    });

    await page.locator('button[aria-label="Открыть меню"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, n + "-menu.png") });
    await page.locator('button[aria-label="Открыть меню"]').click();

    for (const [sel, name] of [
      ["#club", "club"],
      ["#formats", "formats"],
      ["#atmosphere", "atm"],
      ["#faq", "faq"],
    ]) {
      await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "start" }), sel);
      await page.waitForTimeout(550);
      await page.screenshot({ path: path.join(out, n + "-" + name + ".png") });
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, n + "-footer.png") });

    const fmt = await page.evaluate(() =>
      [...document.querySelectorAll("#formats .dest-card-body p")].map((x) => ({
        h: Math.round(x.getBoundingClientRect().height),
        op: getComputedStyle(x).opacity,
      }))
    );

    if (errs.length) issues.push(n + ":" + errs.join("|"));
    if (!brand || brand.disp === "none") issues.push(n + ":brand-hidden");
    if (fmt.some((f) => Number(f.op) < 0.9 || f.h < 20)) issues.push(n + ":formats");

    console.log(n, JSON.stringify({ brand, fmt: fmt.slice(0, 2), errs }));
    await context.close();
  }

  fs.writeFileSync(path.join(out, "verify.json"), JSON.stringify({ issues }, null, 2));
  console.log("ISSUES", JSON.stringify(issues));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
