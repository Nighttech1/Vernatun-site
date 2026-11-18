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
    ['desktop', { viewport: { width: 1440, height: 900 } }],
  ]) {
    const context = await browser.newContext(device.viewport ? device : { ...device });
    const page = await context.newPage();
    const issues = [];

    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(700);

    // Font file loads
    const fontOk = await page.evaluate(async () => {
      try {
        await document.fonts.ready;
        const faces = [...document.fonts].map((f) => f.family + ':' + f.status);
        const loaded = [...document.fonts].some((f) => /Century/i.test(f.family) && f.status === 'loaded');
        const body = getComputedStyle(document.body).fontFamily;
        const check = document.fonts.check('16px "Century Gothic"');
        return { faces: faces.slice(0, 12), loaded, body, check };
      } catch (e) {
        return { err: String(e) };
      }
    });
    if (!fontOk.check && !fontOk.loaded) issues.push('Century Gothic not loaded: ' + JSON.stringify(fontOk));

    if (name === 'iphone15') {
      await page.locator('button[aria-label="Открыть меню"]').click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(out, 'menu.png') });
      const menu = await page.evaluate(() => {
        const sections = [...document.querySelectorAll('.site-mobile-drawer .site-mobile-section')].map((el) => ({
          t: (el.textContent || '').trim(),
          u: getComputedStyle(el).textDecorationLine,
        }));
        const links = [...document.querySelectorAll('.site-mobile-drawer .site-mobile-link')].map((el) => ({
          t: (el.textContent || '').trim(),
          u: getComputedStyle(el).textDecorationLine,
        }));
        return { sections, links };
      });
      const want = ['О нас', 'Расписание', 'Учебные материалы', 'Статьи', 'Контакты'];
      for (const w of want) {
        const s = menu.sections.find((x) => x.t === w);
        if (!s) issues.push('missing section ' + w);
        else if (!String(s.u).includes('underline')) issues.push('section not underlined: ' + w);
      }
      if (menu.links.some((l) => String(l.u).includes('underline'))) issues.push('child links underlined');
      report.menu = menu;
    }

    // Footer headings
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, name + '-footer.png') });
    const footer = await page.evaluate(() => {
      const heads = [...document.querySelectorAll('.site-footer-heading')].map((el) => ({
        t: (el.textContent || '').trim(),
        u: getComputedStyle(el).textDecorationLine,
      }));
      return heads;
    });
    if (footer.some((h) => !String(h.u).includes('underline'))) issues.push('footer heading not underlined');

    // Schedule icons
    await page.goto('http://127.0.0.1:8080/schedule.html', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(out, name + '-schedule.png') });
    const icons = await page.evaluate(() => {
      const dance = document.querySelector('.cal-pill--dance');
      const volley = document.querySelector('.cal-pill--volleyball');
      return {
        dancePaths: dance ? dance.querySelectorAll('circle, path').length : 0,
        volleyPaths: volley ? volley.querySelectorAll('circle, path').length : 0,
        danceSvg: dance ? dance.innerHTML.slice(0, 120) : '',
        volleySvg: volley ? volley.innerHTML.slice(0, 160) : '',
      };
    });
    if (icons.dancePaths < 5) issues.push('dance icon too simple');
    if (icons.volleyPaths < 4) issues.push('volleyball icon too simple');

    report[name] = { issues, fontOk, footer, icons };
    await context.close();
  }

  fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  const bad = Object.values(report).flatMap((r) => (r && r.issues) || []);
  await browser.close();
  if (bad.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
