import { renderBooksHtml, renderWorksHtml } from './render.js';

/**
 * ページはビルド (npm run build) で同人誌・お仕事・JSON-LD が静的に埋め込まれる。
 * このスクリプトは「ハイドレーション」として、最新の JSON で表示内容を再描画し、
 * 折りたたみ UI と年号を制御する（= 静的HTMLへのプログレッシブエンハンスメント）。
 */

document.addEventListener('DOMContentLoaded', () => {
  // 年号更新
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- 同人誌 (books.json) --- */
  fetch('/data/books.json')
    .then((res) => res.json())
    .then((data) => {
      const { newHtml, oldHtml } = renderBooksHtml(data);
      const newEl = document.querySelector('.new-books');
      const oldEl = document.querySelector('.old-books');
      if (newEl) newEl.innerHTML = newHtml;
      if (oldEl) oldEl.innerHTML = oldHtml;
    })
    .catch((error) => console.error('Error loading books.json:', error));

  /* --- お仕事 (works.json) --- */
  fetch('/data/works.json')
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById('works-list-container');
      if (container) container.innerHTML = renderWorksHtml(data);
    })
    .catch((error) => console.error('Error loading works.json:', error));

  initToggleButtons();
});

/* --- 折りたたみ・展開処理 --- */
function initToggleButtons() {
  document.querySelectorAll('.toggle-button').forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetIdentifier = this.getAttribute('data-target');
      let target = document.getElementById(targetIdentifier);
      if (!target) target = document.querySelector(`.${targetIdentifier}`);
      if (!target) return;

      if (target.classList.contains('expanded')) {
        target.classList.remove('expanded');
        if (targetIdentifier === 'works-list-container') {
          target.classList.add('works-collapsed');
        } else if (targetIdentifier === 'doujinshi-container') {
          target.classList.add('books-collapsed');
        }
        this.textContent = 'もっと表示する';
        this.setAttribute('aria-expanded', 'false');
      } else {
        target.classList.add('expanded');
        if (targetIdentifier === 'works-list-container') {
          target.classList.remove('works-collapsed');
        } else if (targetIdentifier === 'doujinshi-container') {
          target.classList.remove('books-collapsed');
        }
        this.textContent = '閉じる';
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
