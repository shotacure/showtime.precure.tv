#!/usr/bin/env node
/**
 * 静的サイトビルド
 *
 *   node tools/build.mjs   (= npm run build)
 *
 * data/*.json を読み込み、ブラウザと同じ render.js を使って
 *   - index.html へ同人誌・お仕事一覧をプリレンダリング（マーカー間に注入）
 *   - index.html へ同人誌・お仕事の JSON-LD を注入
 *   - sitemap.xml の <lastmod> を更新
 * を行う。SEO 上、JavaScript を実行しないクローラーにも全コンテンツが見えるようにする。
 *
 * 依存パッケージなし（Node 標準モジュールのみ）。data/*.json を編集したら再実行すること。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  renderBooksHtml,
  renderWorksHtml,
  buildBooksJsonLd,
  buildWorksJsonLd
} from '../assets/js/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const write = (p, s) => writeFileSync(join(root, p), s);
const readJson = (p) => JSON.parse(read(p));

function injectBetween(src, start, end, content) {
  const s = src.indexOf(start);
  const e = src.indexOf(end);
  if (s === -1 || e === -1) {
    throw new Error(`マーカーが見つかりません: ${start} ... ${end}`);
  }
  return src.slice(0, s + start.length) + content + src.slice(e);
}

const books = readJson('data/books.json');
const works = readJson('data/works.json');

// --- index.html へプリレンダリング ---
const { newHtml, oldHtml } = renderBooksHtml(books);
const worksHtml = renderWorksHtml(works);

const catalogLd = [buildBooksJsonLd(books), buildWorksJsonLd(works)]
  .map((obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n    </script>`)
  .join('\n    ');

let html = read('index.html');
html = injectBetween(html, '<!--WORKS:START-->', '<!--WORKS:END-->', worksHtml);
html = injectBetween(html, '<!--BOOKS-NEW:START-->', '<!--BOOKS-NEW:END-->', newHtml);
html = injectBetween(html, '<!--BOOKS-OLD:START-->', '<!--BOOKS-OLD:END-->', oldHtml);
html = injectBetween(html, '<!--LD-CATALOG:START-->', '<!--LD-CATALOG:END-->', `\n    ${catalogLd}\n    `);
write('index.html', html);

// --- sitemap.xml の lastmod 更新（ビルド日） ---
const today = new Date().toISOString().slice(0, 10);
const sitemap = read('sitemap.xml').replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${today}</lastmod>`);
write('sitemap.xml', sitemap);

console.log(`✓ prerender: お仕事 ${works.length}件 / 同人誌 ${books.length}件`);
console.log(`✓ JSON-LD: 同人誌 ItemList + お仕事 ItemList を index.html に注入`);
console.log(`✓ sitemap.xml lastmod = ${today}`);
