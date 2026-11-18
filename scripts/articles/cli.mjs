#!/usr/bin/env node
// Vernatun articles — agent-facing contract ("API" in the git pipeline model).
//   node scripts/articles/cli.mjs new --slug <s> --title <t> --category <c>
//   node scripts/articles/cli.mjs validate [--slug <s>]
//   node scripts/articles/cli.mjs publish --slug <s>     # draft/review -> published
//   node scripts/articles/cli.mjs list
//
// Agents may create/edit only drafts. `publish` is the human approval step.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readArticles, parseFrontMatter, validateArticle, writeUtf8 } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = process.env.ARTICLES_SRC
  ? path.resolve(process.env.ARTICLES_SRC)
  : path.join(ROOT, 'content', 'articles');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function die(msg) {
  console.error(`❌  ${msg}`);
  process.exit(1);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function cmdNew() {
  const slug = arg('slug');
  const title = arg('title');
  const category = arg('category') || 'Клуб';
  if (!slug || !title) die('нужны --slug и --title');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) die(`slug "${slug}" должен быть a-z0-9 с дефисами`);
  fs.mkdirSync(SRC, { recursive: true });
  const file = path.join(SRC, `${slug}.md`);
  if (fs.existsSync(file)) die(`уже существует: ${file}`);
  const skeleton = `---
slug: ${slug}
title: ${title}
category: ${category}
description: Короткое описание до 160 символов для поиска и соцсетей.
lead: Первый крупный абзац — вводит в тему тёплым разговорным тоном клуба.
date: ${today()}
status: draft
author: claude-agent
---

Первый абзац тела. Пиши как живой разговор перед встречей, без учебникового тона.

Второй абзац. Можно **выделять**, давать [ссылки](/schedule), списки:

- короткий пункт
- ещё один
`;
  writeUtf8(file, skeleton);
  console.log(`✅  Черновик создан: ${path.relative(ROOT, file)} (status: draft)`);
}

function cmdValidate() {
  const only = arg('slug');
  const all = readArticles(SRC);
  const slugs = all.map((a) => a.data.slug);
  const target = only ? all.filter((a) => a.data.slug === only) : all;
  if (!target.length) die(only ? `не найден slug: ${only}` : `нет статей в ${SRC}`);
  let bad = 0;
  for (const a of target) {
    const errs = validateArticle(a.data, a.body, slugs);
    if (errs.length) {
      bad++;
      console.error(`❌  ${a.file}\n   - ${errs.join('\n   - ')}`);
    } else {
      console.log(`✅  ${a.file} (${a.data.status})`);
    }
  }
  if (bad) process.exit(1);
}

function cmdPublish() {
  const slug = arg('slug');
  if (!slug) die('нужен --slug');
  const file = path.join(SRC, `${slug}.md`);
  if (!fs.existsSync(file)) die(`не найден: ${file}`);
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontMatter(raw);
  const errs = validateArticle(data, body, [slug]);
  if (errs.length) die(`статья не валидна, публикация отклонена:\n   - ${errs.join('\n   - ')}`);
  if (data.status === 'published') {
    console.log(`ℹ️  ${slug} уже published`);
    return;
  }
  const next = raw.replace(/^(status:\s*).*$/m, `$1published`);
  writeUtf8(file, next);
  console.log(`✅  ${slug}: status -> published. Теперь: npm run articles:build`);
}

function cmdList() {
  const all = readArticles(SRC);
  if (!all.length) return console.log(`(пусто) ${SRC}`);
  for (const a of all) {
    console.log(`${(a.data.status || '?').padEnd(10)} ${String(a.data.date).padEnd(12)} ${a.data.slug}`);
  }
}

const cmd = process.argv[2];
({ new: cmdNew, validate: cmdValidate, publish: cmdPublish, list: cmdList }[cmd] || (() =>
  die('команды: new | validate | publish | list')))();
