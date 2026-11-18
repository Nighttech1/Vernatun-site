import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:8765';
const OUT = path.resolve('memory/client-review/shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
console.log('FONT', font);

// C-19: mid reveal should not all be visible at top
const revealAtTop = await page.evaluate(() => {
  const faq = document.querySelector('#faq .reveal');
  if (!faq) return null;
  return faq.classList.contains('reveal-visible');
});
console.log('FAQ_REVEAL_AT_TOP', revealAtTop);

// Open dropdown
await page.locator('nav a.site-nav-link').first().hover();
await page.waitForTimeout(300);
const dropBg = await page.evaluate(() => {
  const ul = document.querySelector('.site-dropdown-panel');
  if (!ul) return null;
  const cs = getComputedStyle(ul);
  return { bg: cs.backgroundColor, opacity: cs.opacity };
});
console.log('DROPDOWN', dropBg);
await page.screenshot({ path: path.join(OUT, 'w07-dropdown.png') });

await page.evaluate(() => document.querySelector('#club')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
await page.waitForTimeout(700);
const club = await page.evaluate(() => {
  const oNas = Array.from(document.querySelectorAll('#club p')).some((p) => p.textContent.trim() === 'О нас');
  const tiles = Array.from(document.querySelectorAll('#club .bento-tile')).map((t) => getComputedStyle(t).backgroundColor);
  const games = document.querySelector('#club .bento-tile:last-child')?.textContent || '';
  const clubBg = getComputedStyle(document.querySelector('#club')).backgroundColor;
  const formatsBg = getComputedStyle(document.querySelector('#formats')).backgroundColor;
  return { oNas, tiles, games, clubBg, formatsBg };
});
console.log('CLUB', JSON.stringify(club, null, 2));
await page.screenshot({ path: path.join(OUT, 'w08-club.png') });

await page.evaluate(() => document.querySelector('#formats')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await page.waitForTimeout(500);
const formatsBefore = await page.evaluate(() => {
  const card = document.querySelector('.dest-card');
  const p = card?.querySelector('.dest-card-body p');
  const chip = card?.querySelector('.dest-chip');
  const cs = p ? getComputedStyle(p) : null;
  return {
    chipDisplay: chip ? getComputedStyle(chip).display : 'none',
    pOpacity: cs?.opacity,
    pMaxH: cs?.maxHeight,
  };
});
console.log('FORMATS_IDLE', formatsBefore);
await page.locator('.dest-card').first().hover();
await page.waitForTimeout(500);
const formatsHover = await page.evaluate(() => {
  const card = document.querySelector('.dest-card');
  const p = card?.querySelector('.dest-card-body p');
  const cs = p ? getComputedStyle(p) : null;
  return { pOpacity: cs?.opacity, pMaxH: cs?.maxHeight };
});
console.log('FORMATS_HOVER', formatsHover);
await page.screenshot({ path: path.join(OUT, 'w08-formats-hover.png') });

await page.evaluate(() => document.querySelector('#atmosphere')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
await page.waitForTimeout(400);
const atm = await page.evaluate(() => {
  const outer = document.querySelector('#atmosphere');
  const section = document.querySelector('.atmosphere-section');
  return {
    outerBg: outer ? getComputedStyle(outer).backgroundColor : null,
    padL: outer ? getComputedStyle(outer).paddingLeft : null,
    padR: outer ? getComputedStyle(outer).paddingRight : null,
    sectionBg: section ? getComputedStyle(section).backgroundColor : null,
  };
});
console.log('ATMOSPHERE', atm);
await page.screenshot({ path: path.join(OUT, 'w08-atmosphere.png') });

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, 'w08-footer.png') });

const faqAfterScroll = await page.evaluate(() => {
  const faq = document.querySelector('#faq .reveal');
  return faq?.classList.contains('reveal-visible');
});
console.log('FAQ_REVEAL_AFTER', faqAfterScroll);

await browser.close();
