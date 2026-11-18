import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('memory/client-review/shots');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const cta = await page.locator('a.site-cta').first().evaluate((a) => ({ text: a.textContent.trim(), href: a.href }));
console.log('CTA', cta);

const navBold = await page.locator('a.site-nav-link').first().evaluate((a) => getComputedStyle(a).fontWeight);
console.log('NAV_WEIGHT', navBold);

await page.locator('a[data-nav="about"]').hover();
await page.waitForTimeout(350);
const aboutLinks = await page.evaluate(() => {
  const lis = [...document.querySelectorAll('.site-mega-list li a')].map((a) => a.textContent.trim());
  const descs = [...document.querySelectorAll('.site-mega-list p')].length;
  return { lis, descs, mega: !!document.querySelector('.site-mega') };
});
console.log('ABOUT_MEGA', aboutLinks);
await page.screenshot({ path: path.join(OUT, 'w09-mega-about.png') });

const left1 = await page.evaluate(() => document.querySelector('.site-mega')?.style.left);
await page.locator('a[data-nav="schedule"]').hover();
await page.waitForTimeout(400);
const left2 = await page.evaluate(() => document.querySelector('.site-mega')?.style.left);
const schedLinks = await page.evaluate(() => [...document.querySelectorAll('.site-mega-list li a')].map((a) => a.textContent.trim()));
console.log('MORPH', { left1, left2, schedLinks, samePanel: true });
await page.screenshot({ path: path.join(OUT, 'w09-mega-schedule.png') });

await page.evaluate(() => document.querySelector('#formats')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(700);
const formats = await page.evaluate(() => {
  const eyebrow = [...document.querySelectorAll('#formats p')].some((p) => p.textContent.trim() === 'Форматы');
  const cards = document.querySelectorAll('#formats .dest-card').length;
  const titles = [...document.querySelectorAll('#formats .dest-card h3')].map((h) => h.textContent.trim());
  const cols = getComputedStyle(document.querySelector('.dest-grid')).gridTemplateColumns.split(' ').length;
  return { eyebrow, cards, titles, cols };
});
console.log('FORMATS', formats);
await page.screenshot({ path: path.join(OUT, 'w09-formats.png') });

await page.evaluate(() => document.querySelector('#atmosphere')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(500);
const atm = await page.evaluate(() => {
  const eyebrow = [...document.querySelectorAll('#atmosphere p, #atmosphere .text-xs')].some((p) => p.textContent.trim() === 'Атмосфера');
  return { eyebrow, title: document.querySelector('.atmosphere-title')?.textContent.trim() };
});
console.log('ATM', atm);

const film = await page.evaluate(() => {
  const v = document.querySelector('.film-video');
  const cs = getComputedStyle(v);
  const root = getComputedStyle(document.documentElement);
  return {
    src: v?.getAttribute('src'),
    fit: cs.objectFit,
    zoom: root.getPropertyValue('--film-zoom').trim(),
    posY: root.getPropertyValue('--film-pos-y').trim(),
  };
});
console.log('FILM', film);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, 'w09-film.png') });

// wheel lock smoke: rotate changes when wheel on section
await page.evaluate(() => document.querySelector('#atmosphere')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(400);
const before = await page.evaluate(() => {
  const el = document.querySelector('[x-data*="circularGallery"]');
  return el?.__x?.$data?.rotation ?? null;
});
const box = await page.locator('.atmosphere-section').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.wheel(0, 400);
await page.waitForTimeout(200);
const after = await page.evaluate(() => {
  // Alpine 3 stores differently — read transform
  const ring = document.querySelector('.circular-ring');
  return ring?.getAttribute('style') || '';
});
console.log('WHEEL', { before, after });

await browser.close();
