/* Public read-only calendar contract. Private write credentials never enter this file. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VernatunCalendar = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  var labels = { talk: 'Разговорный клуб', dance: 'Танцы', volleyball: 'Волейбол', tablegames: 'Настольные игры', other: 'Встреча' };
  var images = { talk: '/images/event-talk.png', dance: '/images/event-dance.png?v=20260914c', volleyball: '/images/event-volleyball.png' };
  function text(value, max) { return typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) ? value.trim() : ''; }
  function safeUrl(value, image) {
    var source = text(value, 2048);
    if (image && /^\/images\//.test(source) && !/\.\.|\\/.test(source)) return source;
    try { var parsed = new URL(source); return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? source : ''; } catch (_) { return ''; }
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function normalizeEvents(payload) {
    if (!payload || payload.ok !== true || payload.timezone !== 'Europe/Moscow' || !/^[a-f0-9]{64}$/.test(payload.revision || '') || !Array.isArray(payload.events) || payload.events.length > 500) throw new Error('calendar_unavailable');
    var seen = new Set();
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return payload.events.map(function (row) {
      if (!row || !/^[A-Za-z0-9_-]{1,80}$/.test(row.id || '') || seen.has(row.id) || !validDate(row.date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.startTime || '') || !text(row.title, 160) || !text(row.kind, 80)) throw new Error('calendar_unavailable');
      if (row.endTime && (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.endTime) || row.endTime < row.startTime)) throw new Error('calendar_unavailable');
      seen.add(row.id);
      var kind = Object.prototype.hasOwnProperty.call(labels, row.kind) ? row.kind : 'other';
      var kindLabel = kind === 'other' && row.kind !== 'other' ? text(row.kind, 80) : labels[kind];
      var parts = row.date.split('-');
      return { id: row.id, date: row.date, kind: kind, kindLabel: kindLabel, pillLabel: kindLabel, title: text(row.title, 160),
        time: row.startTime + (row.endTime ? '–' + row.endTime : ''), image: safeUrl(row.image, true) || images[kind] || '/images/event-talk.png',
        description: text(row.description || '', 4000), location: text(row.location || '', 1000), url: safeUrl(row.url, false),
        dateLabel: Number(parts[2]) + ' ' + months[Number(parts[1]) - 1] };
    });
  }
  function moscowToday(now) {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now || new Date());
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return { year: Number(values.year), month: Number(values.month) - 1, day: Number(values.day) };
  }
  return { normalizeEvents: normalizeEvents, moscowToday: moscowToday };
});
