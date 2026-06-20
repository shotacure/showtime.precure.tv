/**
 * 共有レンダリングモジュール
 *
 * ブラウザ (assets/js/main.js) とビルド (tools/build.mjs) の双方から読み込む純粋関数群。
 * DOM や window に依存せず、データ(JSON) から HTML文字列 / 構造化データ(JSON-LD)オブジェクトを生成する。
 * 同じロジックを共有することで、プリレンダリング結果とブラウザでの再描画結果が完全に一致する。
 */

export const SITE_ORIGIN = 'https://showtime.precure.tv';

const boothItemUrl = (id) => `https://shotacure.booth.pm/items/${id}`;

/* ---------- 同人誌 ---------- */

function buildBookRecord(book) {
  const title = book['誌名'];
  const inStock = book['在庫'] === '1';
  let boothHtml = '';
  if (book['BOOTH']) {
    boothHtml = `<a href="${boothItemUrl(book['BOOTH'])}" class="booth-link" target="_blank" rel="noopener">
                          <img src="/assets/images/booth_logo.svg" alt="BOOTHで「${title}」を見る" class="booth-logo">
                        </a>`;
  }
  return {
    book_date: `${book['発行日']} 「${book['初出イベント']}」`,
    book_title: title,
    book_format: `${book['判']}判 / ${book['印刷']} / ${book['総頁']}p`,
    book_description: book['概要'] ? book['概要'].replace(/\n/g, '<br>') : '',
    book_image: book['表紙'] ? `/content/images/${book['表紙']}` : '',
    stockHtml: `<span class="stock-text" style="color: ${inStock ? '#2e7d32' : '#d32f2f'};">${inStock ? '在庫あり' : '在庫なし'}</span>`,
    boothHtml,
    sortDate: new Date(book['発行日']),
    sortPages: Number(book['総頁'] || 0)
  };
}

function renderBookArticle(book) {
  return `
            <article class="book">
              <header class="book_header">
                <p class="book_date">${book.book_date}</p>
              </header>
              <div class="book_image">
                ${book.book_image ? `<img src="${book.book_image}" alt="${book.book_title} 表紙" loading="lazy" decoding="async">` : ''}
              </div>
              <div class="book_data">
                <h4 class="book_title">${book.book_title}</h4>
                <p class="book_format">${book.book_format}</p>
                <p class="book_stock">
                  ${book.stockHtml}
                  ${book.boothHtml}
                </p>
                <p class="book_description">${book.book_description}</p>
              </div>
            </article>
          `;
}

/** @returns {{newHtml:string, oldHtml:string}} 新刊・既刊それぞれのHTML文字列 */
export function renderBooksHtml(data) {
  const sortRecords = (a, b) => (b.sortDate - a.sortDate) || (b.sortPages - a.sortPages);
  const newBooks = [];
  const oldBooks = [];
  data.forEach((book) => {
    (book['新刊'] === '1' ? newBooks : oldBooks).push(buildBookRecord(book));
  });
  newBooks.sort(sortRecords);
  oldBooks.sort(sortRecords);
  return {
    newHtml: newBooks.map(renderBookArticle).join(''),
    oldHtml: oldBooks.map(renderBookArticle).join('')
  };
}

/* ---------- お仕事 ---------- */

/** @returns {string} 年ごとにグループ化したお仕事一覧のHTML文字列 */
export function renderWorksHtml(data) {
  const works = data.map((w) => ({ ...w, parsedDate: new Date(w.Date) }));
  works.sort((a, b) => b.parsedDate - a.parsedDate);

  const grouped = {};
  works.forEach((w) => {
    const year = w.parsedDate.getFullYear();
    (grouped[year] = grouped[year] || []).push(w);
  });

  const years = Object.keys(grouped).sort((a, b) => b - a);
  let html = '';
  let count = 0;
  years.forEach((year) => {
    html += `<div class="year-group"><h3>${year}</h3><ul>`;
    grouped[year].forEach((w) => {
      const cls = count < 15 ? '' : 'hidden-item';
      html += `<li class="${cls}">${w.Date} 「<a href="${w.Link}" target="_blank" rel="noopener">${w.Work}</a>」 ${w.Jobs}</li>`;
      count++;
    });
    html += `</ul></div>`;
  });
  return html;
}

/* ---------- 構造化データ (JSON-LD) ---------- */

/** 同人誌一覧の ItemList / Book 構造化データ */
export function buildBooksJsonLd(data, origin = SITE_ORIGIN) {
  const sorted = data.slice().sort((a, b) => new Date(b['発行日']) - new Date(a['発行日']));
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SHOWTIME 同人誌一覧',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: sorted.length,
    itemListElement: sorted.map((book, i) => {
      const item = {
        '@type': 'Book',
        name: book['誌名'],
        datePublished: book['発行日'],
        inLanguage: 'ja',
        bookFormat: 'https://schema.org/Paperback',
        author: { '@id': origin + '/#person' },
        publisher: { '@type': 'Organization', name: 'SHOWTIME' }
      };
      const pages = Number(book['総頁'] || 0);
      if (pages > 0) item.numberOfPages = pages;
      if (book['概要']) item.description = book['概要'].replace(/\s+/g, ' ').trim();
      if (book['表紙']) item.image = `${origin}/content/images/${book['表紙']}`;
      if (book['BOOTH']) item.url = boothItemUrl(book['BOOTH']);
      return { '@type': 'ListItem', position: i + 1, item };
    })
  };
}

/** お仕事一覧の ItemList / CreativeWork 構造化データ */
export function buildWorksJsonLd(data, origin = SITE_ORIGIN) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SHOWTIME（祥太）お仕事・出演・寄稿一覧',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: data.length,
    itemListElement: data.map((work, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: work.Work,
        datePublished: work.Date,
        url: work.Link,
        inLanguage: 'ja',
        contributor: { '@id': origin + '/#person' }
      }
    }))
  };
}
