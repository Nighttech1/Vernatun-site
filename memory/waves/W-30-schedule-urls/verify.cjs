const { chromium, devices } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ ...devices['iPhone 15'] });
  const p = await c.newPage();
  const issues = [];

  const r = await p.goto('http://127.0.0.1:8080/schedule', { waitUntil: 'networkidle', timeout: 30000 });
  if (!r || r.status() !== 200) issues.push('schedule clean URL status ' + (r && r.status()));
  await p.waitForTimeout(900);

  const cal = await p.evaluate(() => {
    const el = document.querySelector('[x-data*="clubCalendar"]');
    const data = window.Alpine.$data(el);
    data.year = 2026;
    data.month = 8;
    data.reloadMonth();
    const collect = () => {
      const byDate = {};
      data.events.forEach((ev) => {
        if (!byDate[ev.date]) byDate[ev.date] = [];
        byDate[ev.date].push(ev.kind + ':' + ev.time);
      });
      return byDate;
    };
    const sep = collect();
    data.year = 2026;
    data.month = 9;
    data.reloadMonth();
    const oct = collect();
    return {
      sep19: sep['2026-09-19'],
      sep26: sep['2026-09-26'],
      oct3: oct['2026-10-03'],
      menuHref: [...document.querySelectorAll('a')]
        .map((a) => a.getAttribute('href') || '')
        .filter((h) => h.includes('schedule') || h.includes('articles') || h.includes('contacts'))
        .slice(0, 12),
      desc: document.querySelector('meta[name="description"]')?.content || '',
      danceCircles: document.querySelectorAll('.cal-pill--dance svg circle').length,
    };
  });

  if (!cal.sep19 || cal.sep19.join() !== 'dance:18:00–20:00') issues.push('sep19 ' + JSON.stringify(cal.sep19));
  if (!cal.sep26 || cal.sep26.join() !== 'talk:15:00–18:00') issues.push('sep26 ' + JSON.stringify(cal.sep26));
  if (!cal.oct3 || cal.oct3.join() !== 'dance:18:00–20:00') issues.push('oct3 ' + JSON.stringify(cal.oct3));
  if (cal.menuHref.some((h) => /\.html/.test(h))) issues.push('menu still .html ' + JSON.stringify(cal.menuHref));
  if (!cal.desc.includes('армянский дом')) issues.push('bad desc');
  if (cal.danceCircles < 2) issues.push('dance icon needs 2 circles, got ' + cal.danceCircles);

  // homepage meta
  await p.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded' });
  const homeDesc = await p.evaluate(() => document.querySelector('meta[property="og:description"]')?.content || '');
  if (!homeDesc.includes('армянский дом')) issues.push('home og desc');

  console.log(JSON.stringify({ issues, cal, homeDesc: homeDesc.slice(0, 60) }, null, 2));
  await b.close();
  if (issues.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
