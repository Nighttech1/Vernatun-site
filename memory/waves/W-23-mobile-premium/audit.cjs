const { chromium, devices } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const out = "E:/Applications/Vernatun/memory/waves/W-23-mobile-premium/baseline";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 15"] });
  const page = await context.newPage();

  const urls = [
    ["http://127.0.0.1:8080/", "home"],
    ["http://127.0.0.1:8080/about.html", "about"],
    ["http://127.0.0.1:8080/schedule.html", "schedule"],
    ["http://127.0.0.1:8080/materials.html", "materials"],
    ["http://127.0.0.1:8080/articles.html", "articles"],
    ["http://127.0.0.1:8080/contacts.html", "contacts"],
    ["http://127.0.0.1:8080/articles/esli-stesnyaeshsya.html", "article1"],
    ["http://127.0.0.1:8080/materials/podcasts/ideal-life/index.html", "podcast"],
  ];

  const findings = [];

  for (const [url, name] of urls) {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => null);
    if (!resp || !resp.ok()) {
      findings.push({ name, url, error: "nav_fail", status: resp && resp.status() });
      continue;
    }
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, name + "-hero.png") });

    const m = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowX = doc.scrollWidth > doc.clientWidth + 1;
      const smallTaps = [];
      const selectors = "a, button, summary, .cal-pill, .site-cta, .mag-open, [role=button]";
      document.querySelectorAll(selectors).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        if (r.bottom < 0 || r.top > innerHeight) return; // only viewport-ish later full
        const short = Math.min(r.width, r.height);
        if (short < 40 && short > 0) {
          smallTaps.push({
            tag: el.tagName,
            text: (el.textContent || "").trim().slice(0, 28),
            cls: (el.className + "").toString().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      });
      // hover-only opacity-0 that aren't open
      const hiddenHover = [...document.querySelectorAll("*")].filter((el) => {
        const cls = [...el.classList];
        return cls.some((c) => c.includes("group-hover") || c === "opacity-0");
      }).length;
      // clipped headings
      const clipped = [...document.querySelectorAll("h1,h2,h3,.film-quote")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < -4 || r.right > innerWidth + 4;
      }).map((el) => (el.textContent || "").trim().slice(0, 40));
      // touch-action none large
      const touchNone = [...document.querySelectorAll("*")].filter((el) => {
        const t = getComputedStyle(el).touchAction;
        if (t !== "none") return false;
        const r = el.getBoundingClientRect();
        return r.width > 180 && r.height > 180;
      }).map((el) => (el.className + "").toString().slice(0, 40));

      return {
        overflowX,
        sw: doc.scrollWidth,
        cw: doc.clientWidth,
        smallTaps: smallTaps.slice(0, 12),
        hiddenHover,
        clipped,
        touchNone,
        title: document.title,
      };
    });

    // full page small taps (scroll through)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(out, name + "-mid.png") });

    findings.push({ name, url, ...m });
  }

  // Home deep: menu, formats desc, faq, footer, atmosphere scroll
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.locator('button[aria-label="Открыть меню"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "home-menu.png") });
  const menu = await page.evaluate(() => {
    const d = document.querySelector(".site-mobile-drawer");
    const brand = document.querySelector(".site-brand-name");
    return {
      bg: d && getComputedStyle(d).backgroundColor,
      brand: brand && getComputedStyle(brand).color,
      solid: document.querySelector("header")?.classList.contains("is-solid"),
    };
  });
  await page.locator('button[aria-label="Открыть меню"]').click();

  await page.evaluate(() => document.querySelector("#formats")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "home-formats.png") });
  const formats = await page.evaluate(() => {
    const ps = [...document.querySelectorAll("#formats .dest-card-body p")];
    return ps.map((p) => ({
      op: getComputedStyle(p).opacity,
      h: Math.round(p.getBoundingClientRect().height),
      text: (p.textContent || "").trim().slice(0, 30),
    }));
  });

  await page.evaluate(() => document.querySelector("#atmosphere")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "home-atmosphere.png") });
  const atmosphere = await page.evaluate(() => {
    const s = document.querySelector(".circular-sticky");
    return { ta: s && getComputedStyle(s).touchAction };
  });

  await page.evaluate(() => document.querySelector("#faq")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "home-faq.png") });
  const faq = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".faq-item summary")];
    return items.slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect();
      return { h: Math.round(r.height), text: (el.textContent || "").trim().slice(0, 40) };
    });
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "home-footer.png") });

  // schedule pills
  await page.goto("http://127.0.0.1:8080/schedule.html", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  const schedule = await page.evaluate(() => {
    const pills = [...document.querySelectorAll(".cal-pill")].slice(0, 8).map((el) => {
      const r = el.getBoundingClientRect();
      return { t: (el.textContent || "").trim(), h: Math.round(r.height), w: Math.round(r.width) };
    });
    return {
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      pills,
    };
  });
  await page.screenshot({ path: path.join(out, "schedule-detail.png") });

  // header crowding metric
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const header = await page.evaluate(() => {
    const brand = document.querySelector(".site-brand-name");
    const cta = document.querySelector(".site-cta");
    const burger = document.querySelector('button[aria-label="Открыть меню"]');
    const b = (el) => {
      const r = el.getBoundingClientRect();
      return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      burger: b(burger),
      brand: b(brand),
      cta: b(cta),
      gap: Math.round(cta.getBoundingClientRect().left - brand.getBoundingClientRect().right),
      vw: innerWidth,
    };
  });

  const report = { findings, menu, formats, atmosphere, faq, schedule, header };
  fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(report, null, 2));

  // summarize issues
  const issues = [];
  if (menu.bg && !menu.bg.includes("249")) issues.push("menu_bg");
  if (formats.some((f) => Number(f.op) < 0.9 || f.h < 20)) issues.push("formats_desc_hidden");
  if (atmosphere.ta === "none") issues.push("circular_touch_none");
  if (schedule.pills.some((p) => p.h < 40)) issues.push("pills_small");
  if (header.cta.h < 44) issues.push("cta_small");
  if (header.gap < 12) issues.push("header_cramped");
  findings.forEach((f) => {
    if (f.overflowX) issues.push("overflow:" + f.name);
    if (f.clipped && f.clipped.length) issues.push("clipped:" + f.name);
    if (f.touchNone && f.touchNone.length) issues.push("touchNone:" + f.name + ":" + f.touchNone.join("|"));
    if (f.smallTaps && f.smallTaps.length >= 3) issues.push("smallTaps:" + f.name + ":" + f.smallTaps.length);
  });
  if (faq.some((f) => f.h < 40)) issues.push("faq_summary_small");

  console.log(JSON.stringify({ issues, header, menu, formatsCount: formats.length, schedulePills: schedule.pills, faq, atmosphere }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
