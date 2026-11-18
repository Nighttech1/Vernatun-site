const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");
(async () => {
  const out = "E:/Applications/Vernatun/memory/waves/W-22-mobile-premium/baseline";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 15"] });
  const page = await context.newPage();
  const pages = [
    ["http://127.0.0.1:8080/", "home"],
    ["http://127.0.0.1:8080/about.html", "about"],
    ["http://127.0.0.1:8080/schedule.html", "schedule"],
    ["http://127.0.0.1:8080/materials.html", "materials"],
    ["http://127.0.0.1:8080/articles.html", "articles"],
    ["http://127.0.0.1:8080/contacts.html", "contacts"],
  ];
  const report = [];
  for (const [url, name] of pages) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(out, name + "-hero.png") });
    const m = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowX = doc.scrollWidth > doc.clientWidth + 1;
      const brand = document.querySelector(".site-brand-name");
      const cta = document.querySelector(".site-cta");
      const burger = document.querySelector('button[aria-label="Открыть меню"]');
      const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) };
      };
      const b = box(brand), c = box(cta), g = box(burger);
      return {
        overflowX, sw: doc.scrollWidth, cw: doc.clientWidth,
        gapBrandCta: b && c ? c.left - b.right : null,
        brand: b, cta: c, burger: g,
        hScrollIds: [...document.querySelectorAll("section, .carousel, [class*='overflow']")]
          .filter((el) => el.scrollWidth > el.clientWidth + 2)
          .map((el) => (el.id || el.className || "").toString().slice(0, 50)),
      };
    });
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, name + "-mid.png") });
    report.push({ name, ...m });
  }
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const el = document.querySelector("#formats");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "home-formats.png") });
  const formats = await page.evaluate(() => {
    const root = document.querySelector("#formats");
    if (!root) return { missing: true };
    const cards = [...root.querySelectorAll(".dest-card")];
    const opacity0 = [...root.querySelectorAll(".opacity-0")].length;
    const groupHover = [...root.querySelectorAll("*")].filter((el) =>
      [...el.classList].some((c) => c.includes("group-hover"))
    ).length;
    return {
      cards: cards.length,
      opacity0,
      groupHover,
      cardW: cards[0] ? Math.round(cards[0].getBoundingClientRect().width) : 0,
      cardH: cards[0] ? Math.round(cards[0].getBoundingClientRect().height) : 0,
    };
  });
  await page.evaluate(() => {
    const el = document.querySelector("#club");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "home-club.png") });
  const club = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll(".bento-tile, #club .grid > *")];
    return tiles.slice(0, 6).map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: (el.className + "").slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify({ report, formats, club }, null, 2));
  console.log(JSON.stringify({ report, formats, club }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
