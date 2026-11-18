// Vernatun articles pipeline — zero-dependency helpers.
// Front-matter parsing, a safe Markdown subset, HTML escaping, and the
// article-page template (kept 1:1 with the existing static article pages).

import fs from 'node:fs';
import path from 'node:path';

// Asset cache-buster used across the static site. Keep in sync with the
// ?v=... suffix in the hand-written pages (css/site.css, js/site.js, fonts).
export const ASSET_VER = '20260920a';
export const SITE_ORIGIN = 'https://vernatunspeakclub.com';

export const REQUIRED_FIELDS = ['slug', 'title', 'category', 'description', 'lead', 'date', 'status'];
export const STATUSES = ['draft', 'review', 'published'];
export const LIMITS = { title: 80, description: 160, lead: 400, category: 40 };

// --- front-matter (small YAML subset: `key: value`, optional quotes) --------

export function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) {
    throw new Error('front-matter не найден (файл должен начинаться с "---")');
  }
  const end = text.indexOf('\n---', 4);
  if (end === -1) throw new Error('front-matter не закрыт ("---")');
  const head = text.slice(4, end);
  const body = text.slice(text.indexOf('\n', end + 1) + 1).replace(/^\n+/, '');
  const data = {};
  for (const line of head.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const m = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) throw new Error(`не разобрать строку front-matter: "${line}"`);
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[m[1]] = val;
  }
  return { data, body };
}

// --- escaping ---------------------------------------------------------------

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Allow only safe link targets: site-relative (/...) or http(s).
function safeHref(url) {
  const u = url.trim();
  if (u.startsWith('/') || /^https?:\/\//i.test(u)) return u;
  throw new Error(`недопустимая ссылка: "${url}" (только / или http(s))`);
}

// --- Markdown subset: paragraphs, ## headings, - lists, **bold**, [t](url) --

function renderInline(text) {
  let out = escapeHtml(text);
  // links first (operate on already-escaped text; hrefs validated separately)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const href = escapeHtml(safeHref(url));
    const ext = /^https?:\/\//i.test(url.trim()) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}" class="font-semibold text-azure underline decoration-sungold/70 underline-offset-4"${ext}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

export function renderBody(md) {
  const blocks = md.trim().split(/\n{2,}/);
  const parts = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.every((l) => l.trimStart().startsWith('- '))) {
      const items = lines.map((l) => `<li>${renderInline(l.trimStart().slice(2))}</li>`).join('\n          ');
      parts.push(`<ul class="list-disc space-y-1 pl-5">\n          ${items}\n        </ul>`);
    } else if (block.startsWith('## ')) {
      parts.push(`<h2 class="font-display text-xl font-bold text-azure">${renderInline(block.slice(3))}</h2>`);
    } else {
      parts.push(`<p>${renderInline(block.replace(/\n/g, ' '))}</p>`);
    }
  }
  return parts.join('\n        ');
}

// --- validation -------------------------------------------------------------

export function validateArticle(data, body, knownSlugs = []) {
  const errors = [];
  for (const f of REQUIRED_FIELDS) {
    if (!data[f] || !String(data[f]).trim()) errors.push(`пустое обязательное поле: ${f}`);
  }
  if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push(`slug "${data.slug}" должен быть вида a-z0-9 с дефисами`);
  }
  if (data.status && !STATUSES.includes(data.status)) {
    errors.push(`status "${data.status}" не из ${STATUSES.join('|')}`);
  }
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push(`date "${data.date}" должен быть YYYY-MM-DD`);
  }
  for (const [f, max] of Object.entries(LIMITS)) {
    if (data[f] && String(data[f]).length > max) errors.push(`${f}: длиннее ${max} символов`);
  }
  if (knownSlugs.filter((s) => s === data.slug).length > 1) {
    errors.push(`дублирующийся slug: ${data.slug}`);
  }
  if (!body || !body.trim()) errors.push('пустое тело статьи');
  if (/<\s*script/i.test(body) || /<\s*script/i.test(data.lead || '')) {
    errors.push('сырой <script> запрещён');
  }
  return errors;
}

// --- templates --------------------------------------------------------------

export function renderArticlePage({ data, body }) {
  const url = `${SITE_ORIGIN}/articles/${data.slug}`;
  const title = escapeHtml(data.title);
  const desc = escapeHtml(data.description);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    datePublished: data.date,
    inLanguage: 'ru',
    mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: 'Вернатун' },
  };
  return `<!DOCTYPE html>
<html class="scroll-smooth" lang="ru" data-root="/">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title} — Вернатун" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <title>${title} — Вернатун</title>
  <link rel="canonical" href="${url}" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/js/tailwind-config.js?v=${ASSET_VER}"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
  <link rel="preload" href="/fonts/CenturyGothic.ttf?v=${ASSET_VER}" as="font" type="font/ttf" crossorigin />
  <link rel="preload" href="/fonts/CenturyGothic-Bold.ttf?v=${ASSET_VER}" as="font" type="font/ttf" crossorigin />
  <link rel="stylesheet" href="/css/site.css?v=${ASSET_VER}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="paper-grain min-h-screen antialiased text-azure" x-data="lightbox()" @keydown.escape.window="close()">
  <div id="site-header"></div>
  <script src="/js/site.js?v=${ASSET_VER}"></script>
  <main>
    <article class="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p class="text-xs font-bold uppercase tracking-widest text-terracotta">Статья</p>
      <h1 class="mt-3 font-display text-3xl font-bold text-azure sm:text-4xl">${title}</h1>
      <p class="mt-6 text-lg leading-relaxed text-ink/80">${renderInline(data.lead)}</p>
      <div class="mt-8 space-y-4 text-base leading-relaxed text-ink/75">
        ${renderBody(body)}
      </div>
      <p class="mt-10"><a href="/articles" class="text-sm font-semibold text-azure underline decoration-sungold/70 underline-offset-4">Все статьи</a></p>
    </article>
  </main>
  <div id="site-footer"></div>
  <script>VernatunChrome.mountRest();</script>
</body>
</html>
`;
}

export function renderListRow(data) {
  return `          <a href="/articles/${data.slug}" class="magazine-row group">
            <p class="text-xs font-bold uppercase tracking-widest text-terracotta">${escapeHtml(data.category)}</p>
            <p class="font-display text-2xl text-azure group-hover:text-terracotta">${escapeHtml(data.title)}</p>
            <p class="mag-open text-sm text-ink/50">Читать</p>
          </a>`;
}

export function renderNavLink(data) {
  return `        { href: '/articles/${data.slug}', label: ${JSON.stringify(data.title)} },`;
}

export function renderSitemapUrl(data) {
  return `  <url>
    <loc>${SITE_ORIGIN}/articles/${data.slug}</loc>
    <lastmod>${data.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
}

// --- marker region replace --------------------------------------------------

export function replaceRegion(source, startMarker, endMarker, inner, file) {
  const s = source.indexOf(startMarker);
  const e = source.indexOf(endMarker);
  if (s === -1 || e === -1 || e < s) {
    throw new Error(`маркеры ${startMarker}…${endMarker} не найдены в ${file}`);
  }
  const before = source.slice(0, s + startMarker.length);
  const after = source.slice(e);
  return `${before}\n${inner}\n${after}`;
}

// --- io ---------------------------------------------------------------------

export function readArticles(srcDir) {
  if (!fs.existsSync(srcDir)) return [];
  return fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(srcDir, f), 'utf8');
      const { data, body } = parseFrontMatter(raw);
      return { file: f, data, body };
    })
    .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));
}

export function writeUtf8(file, content) {
  // Explicitly strip any BOM; the site has been bitten by mojibake before.
  fs.writeFileSync(file, content.replace(/^﻿/, ''), { encoding: 'utf8' });
}
