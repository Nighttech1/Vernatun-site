#!/usr/bin/env node
// Vernatun articles generator.
//   node scripts/articles/build.mjs           # render published articles
//   node scripts/articles/build.mjs --preview # also render draft/review
//
// Source of truth: $ARTICLES_SRC or ./content/articles (*.md with front-matter).
// Outputs: articles/<slug>.html, and marker regions in articles.html,
// js/site.js, public/sitemap.xml. Writes only between markers elsewhere.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readArticles,
  validateArticle,
  renderArticlePage,
  renderListRow,
  renderNavLink,
  renderSitemapUrl,
  replaceRegion,
  writeUtf8,
} from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = process.env.ARTICLES_SRC
  ? path.resolve(process.env.ARTICLES_SRC)
  : path.join(ROOT, 'content', 'articles');
const PREVIEW = process.argv.includes('--preview');
const NAV_MAX = 6; // how many recent articles to list in the header dropdown

function fail(msg) {
  console.error(`❌  ${msg}`);
  process.exit(1);
}

function main() {
  const all = readArticles(SRC);
  if (!all.length) fail(`нет статей в источнике: ${SRC}`);

  // validate everything, always
  const slugs = all.map((a) => a.data.slug);
  for (const a of all) {
    const errs = validateArticle(a.data, a.body, slugs);
    if (errs.length) fail(`${a.file}:\n   - ${errs.join('\n   - ')}`);
  }

  const live = all.filter((a) => PREVIEW || a.data.status === 'published');
  if (!live.length) fail('нет статей со status: published (для preview добавьте --preview)');

  // 1) article pages (+ prune orphans: html with no live source anymore)
  const outDir = path.join(ROOT, 'articles');
  fs.mkdirSync(outDir, { recursive: true });
  const liveSlugs = new Set(live.map((a) => a.data.slug));
  for (const a of live) {
    writeUtf8(path.join(outDir, `${a.data.slug}.html`), renderArticlePage(a));
  }
  for (const f of fs.readdirSync(outDir).filter((f) => f.endsWith('.html'))) {
    if (!liveSlugs.has(f.replace(/\.html$/, ''))) {
      fs.rmSync(path.join(outDir, f));
      console.log(`−  удалён осиротевший ${f} (нет published-источника)`);
    }
  }

  // 2) list page (articles.html)
  const listFile = path.join(ROOT, 'articles.html');
  const listInner = live.map((a) => renderListRow(a.data)).join('\n');
  writeUtf8(
    listFile,
    replaceRegion(
      fs.readFileSync(listFile, 'utf8'),
      '<!-- ARTICLES:START -->',
      '<!-- ARTICLES:END -->',
      listInner,
      'articles.html',
    ),
  );

  // 3) header dropdown (js/site.js)
  const navFile = path.join(ROOT, 'js', 'site.js');
  const navInner = live.slice(0, NAV_MAX).map((a) => renderNavLink(a.data)).join('\n');
  writeUtf8(
    navFile,
    replaceRegion(
      fs.readFileSync(navFile, 'utf8'),
      '/* ARTICLES:START */',
      '/* ARTICLES:END */',
      navInner,
      'js/site.js',
    ),
  );

  // 4) sitemap (public/sitemap.xml)
  const mapFile = path.join(ROOT, 'public', 'sitemap.xml');
  const mapInner = live.map((a) => renderSitemapUrl(a.data)).join('\n');
  writeUtf8(
    mapFile,
    replaceRegion(
      fs.readFileSync(mapFile, 'utf8'),
      '<!-- ARTICLES:START -->',
      '<!-- ARTICLES:END -->',
      mapInner,
      'public/sitemap.xml',
    ),
  );

  const skipped = all.length - live.length;
  console.log(
    `✅  Собрано ${live.length} статей → articles/*.html, список, навигация, sitemap.` +
      (skipped ? ` (${skipped} в черновиках пропущено)` : '') +
      (PREVIEW ? ' [PREVIEW]' : ''),
  );
}

main();
