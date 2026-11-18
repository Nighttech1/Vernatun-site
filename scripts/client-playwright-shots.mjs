/**
 * Client visual ritual — screenshots for acceptance (1440 + 390).
 * Usage: node scripts/client-playwright-shots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.VERNATUN_URL || 'http://127.0.0.1:8765';
const OUT = path.resolve('memory/client-review/shots');
const pages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about.html' },
  { name: 'schedule', path: '/schedule.html' },
  { name: 'materials', path: '/materials.html' },
  { name: 'articles', path: '/articles.html' },
];
const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  for (const p of pages) {
    const url = BASE + p.path;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);
    const file = path.join(OUT, `${p.name}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log('OK', file);
  }
  // About: scrolled mid + footer at 1440 only
  if (vp.name === '1440') {
    await page.goto(BASE + '/about.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'about-formats-1440.png'), fullPage: false });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'about-footer-1440.png'), fullPage: false });
    console.log('OK about mid/footer');

    await page.goto(BASE + '/schedule.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const icon = page.locator('.cal-icon').first();
    if (await icon.count()) {
      await icon.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(OUT, 'schedule-panel-1440.png'), fullPage: false });
    console.log('OK schedule panel');
  }
  await context.close();
}
await browser.close();
console.log('DONE', OUT);
