const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { normalizeEvents, moscowToday } = require('../js/calendar-feed.js');
const payload = (event = {}) => ({ ok: true, revision: 'a'.repeat(64), timezone: 'Europe/Moscow', events: [{ id: 'event_1', date: '2026-11-21', startTime: '15:00', endTime: '18:00', kind: 'talk', title: 'Точная тема', description: 'Описание', location: 'Москва', image: '', url: '', ...event }] });

test('public event becomes calendar detail with exact title and links sanitized', () => {
  const [event] = normalizeEvents(payload({ title: '<script>alert(1)</script>', url: 'javascript:alert(1)', image: 'data:image/svg+xml,<svg/>' }));
  assert.equal(event.title, '<script>alert(1)</script>'); // rendered through x-text, never x-html
  assert.equal(event.time, '15:00–18:00');
  assert.equal(event.dateLabel, '21 ноября');
  assert.equal(event.url, '');
  assert.equal(event.image, '/images/event-talk.png');
  assert.equal(normalizeEvents(payload({ kind: 'Книжный вечер' }))[0].kind, 'other');
  assert.equal(normalizeEvents(payload({ kind: 'Книжный вечер' }))[0].kindLabel, 'Книжный вечер');
});

test('bad source and impossible dates fail without invented recurring fallback', () => {
  for (const bad of [null, {ok: false}, { ...payload(), events: null }, payload({date: '2026-02-30'}), payload({startTime: '25:00'}), payload({endTime: '14:00'}), payload({title: ''})]) assert.throws(() => normalizeEvents(bad));
  assert.deepEqual(normalizeEvents({...payload(), events: []}), []);
  const duplicate = payload(); duplicate.events.push({...duplicate.events[0]});
  assert.throws(() => normalizeEvents(duplicate));
  assert.equal(normalizeEvents(payload({ title: 'Т'.repeat(160), kind: 'К'.repeat(80), id: 'a'.repeat(80) }))[0].title.length, 160);
});

test('Moscow calendar date does not follow browser timezone at midnight', () => {
  assert.deepEqual(moscowToday(new Date('2026-11-20T22:30:00Z')), {year: 2026, month: 10, day: 21});
});

function calendarHarness(fetch) {
  const listeners = {}, factories = {};
  const context = { console, URL, Set, Date, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, fetch,
    document: { readyState: 'loading', hidden: false, documentElement: {getAttribute: () => '/'}, getElementById: (id) => id === 'vernatun-brand-css' ? {textContent:''} : null, addEventListener: (name, callback) => {listeners[name] = callback;} },
    window: {VernatunCalendar: {normalizeEvents, moscowToday: () => ({year:2026,month:10,day:19})}},
    Alpine: {data: (name, factory) => {factories[name] = factory;}} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/site.js'), 'utf8'), context);
  listeners['alpine:init']();
  return factories.clubCalendar();
}

test('late prior-month responses cannot replace newer navigation', async () => {
  const pending = [];
  const calendar = calendarHarness((url) => new Promise(resolve => {pending.push({url, resolve});}));
  const november = calendar.reloadMonth();
  calendar.month = 11;
  const december = calendar.reloadMonth();
  pending[1].resolve({ok:true,json:async()=>payload({id:'december',date:'2026-12-21'})});
  await december;
  pending[0].resolve({ok:true,json:async()=>payload({id:'november',date:'2026-11-21'})});
  await november;
  assert.equal(calendar.events.length, 1);
  assert.equal(calendar.events[0].id, 'december');
  assert.equal(calendar.selectedId, 'december');
  assert.equal(calendar.loading, false);
});

test('network failure shows clear error and no old or fabricated events', async () => {
  const calendar = calendarHarness(async () => ({ok:false}));
  await calendar.reloadMonth();
  assert.equal(calendar.events.length, 0);
  assert.equal(calendar.selectedId, null);
  assert.equal(calendar.loading, false);
  assert.match(calendar.error, /Не удалось загрузить расписание/);
  assert(calendar.flatCells.every(cell => cell.events.length === 0));
});
