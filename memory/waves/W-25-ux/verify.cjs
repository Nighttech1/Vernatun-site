const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.join(__dirname, 'after');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = {};

  for (const [name, device] of [
    ['iphone15', devices['iPhone 15']],
    ['pixel7', devices['Pixel 7']],
  ]) {
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    const issues = [];

    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(900);

    // C-65 menu page underline
    await page.locator('button[aria-label="Открыть меню"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, name + '-menu.png') });
    const menu = await page.evaluate(() => {
      const pages = [...document.querySelectorAll('.site-mobile-drawer a.site-mobile-page')].map((a) => ({
        t: (a.textContent || '').trim(),
        u: getComputedStyle(a).textDecorationLine,
      }));
      const blocks = [...document.querySelectorAll('.site-mobile-drawer a.site-mobile-link:not(.site-mobile-page)')].map((a) => ({
        t: (a.textContent || '').trim(),
        u: getComputedStyle(a).textDecorationLine,
        href: a.getAttribute('href'),
      }));
      return { pages, blocks };
    });
    if (!menu.pages.length) issues.push('no site-mobile-page links');
    if (menu.pages.some((p) => !String(p.u).includes('underline'))) issues.push('page links missing underline');
    if (menu.blocks.filter((b) => (b.href || '').includes('#')).some((b) => String(b.u).includes('underline'))) {
      issues.push('block links underlined');
    }
    await page.locator('button[aria-label="Открыть меню"]').click();
    await page.waitForTimeout(200);

    // C-66 bento tap
    await page.evaluate(() => document.querySelector('#club')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await page.locator('#club .bento-tile').nth(1).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(out, name + '-bento.png') });
    const bento = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('#club .bento-tile')].map((el) => ({
        hot: el.classList.contains('is-hot'),
        dim: el.classList.contains('is-dim'),
        filter: getComputedStyle(el).filter,
        opacity: getComputedStyle(el).opacity,
      }));
      return tiles;
    });
    const dimmed = bento.filter((t) => t.dim).length;
    if (dimmed < 1) issues.push('bento tap did not dim others');

    // C-67 atmosphere
    await page.evaluate(() => document.querySelector('#atmosphere')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, name + '-atm.png') });
    const atm = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.circular-nav-btn')];
      const alpineRoot = document.querySelector('[x-data*="circularGallery"]');
      let speed = null;
      try {
        speed = alpineRoot && window.Alpine && Alpine.$data(alpineRoot).autoRotateSpeed;
      } catch (e) {}
      return {
        navCount: btns.length,
        speed,
        hasNav: !!document.querySelector('.circular-nav'),
      };
    });
    if (atm.navCount < 2) issues.push('circular nav buttons missing');
    if (!(atm.speed >= 0.06 && atm.speed <= 0.08)) issues.push('autoRotateSpeed not ~1.5x (' + atm.speed + ')');

    // lightbox viewport lock
    await page.locator('.circular-item').first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    const lb = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      const overlay = document.querySelector('.site-lightbox');
      return {
        vp: meta && meta.getAttribute('content'),
        active: overlay && getComputedStyle(overlay).display !== 'none',
      };
    });
    if (lb.active && !(lb.vp || '').includes('maximum-scale=1')) issues.push('lightbox viewport not locked');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // C-68 schedule
    await page.goto('http://127.0.0.1:8080/schedule.html', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, name + '-schedule.png') });
    const sched = await page.evaluate(() => {
      const legend = (document.querySelector('.cal-legend') || {}).innerText || '';
      const pills = [...document.querySelectorAll('.cal-pill')].slice(0, 8).map((el) => ({
        hasSvg: !!el.querySelector('svg'),
        text: (el.textContent || '').trim(),
        active: el.classList.contains('is-active'),
      }));
      const selectedDays = document.querySelectorAll('.cal-day.is-selected').length;
      const active = document.querySelector('.cal-pill.is-active');
      let ring = null;
      if (active) {
        const sh = getComputedStyle(active).boxShadow;
        ring = sh;
      }
      return { legend, pills, selectedDays, ring, myach: legend.includes('Мяч') || pills.some((p) => p.text.includes('Мяч')) };
    });
    if (!/Волейбол/.test(sched.legend)) issues.push('legend missing Волейбол');
    if (/Мяч/.test(sched.legend) || sched.myach) issues.push('Мяч still present');
    if (sched.pills.some((p) => !p.hasSvg)) issues.push('pills without icons');
    if (sched.selectedDays > 0) issues.push('day is-selected still used');

    // C-69 font
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    if (!/Century Gothic/i.test(font)) issues.push('body font not Century Gothic: ' + font);

    report[name] = { issues, menu, bento, atm, lb, sched, font };
    await context.close();
  }

  fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  const bad = Object.values(report).flatMap((r) => r.issues);
  await browser.close();
  if (bad.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
