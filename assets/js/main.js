document.addEventListener('DOMContentLoaded', function() {
  // 年号更新
  document.getElementById('year').textContent = new Date().getFullYear();

  /* --- 同人誌 (books.json) の処理 --- */
  fetch('/data/books.json')
    .then(response => response.json())
    .then(data => {
      const newBooks = [];
      const oldBooks = [];

      data.forEach(book => {
        // books.json の日付は既に "yyyy-MM-dd" 形式なので、初出イベントを連結して表示
        const book_date = `${book["発行日"]} 「${book["初出イベント"]}」`;
        const book_title = book["誌名"];
        const book_format = `${book["判"]}判 / ${book["印刷"]} / ${book["総頁"]}p`;
        const book_description = book["概要"] ? book["概要"].replace(/\n/g, '<br>') : '';
        const book_image = book["表紙"] ? `/content/images/${book["表紙"]}` : '';
        const inStock = book["在庫"] === "1";
        const stockText = inStock ? "在庫あり" : "在庫なし";
        const stockHtml = `<span class="stock-text" style="color: ${inStock ? '#66CC66' : '#FF6666'};">${stockText}</span>`;
        let boothHtml = '';
        if (book["BOOTH"]) {
          boothHtml = `<a href="https://shotacure.booth.pm/items/${book["BOOTH"]}" class="booth-link" target="_blank">
                          <img src="/assets/images/booth_logo.svg" alt="BOOTH" class="booth-logo">
                        </a>`;
        }
        const record = {
          book_date,
          book_title,
          book_format,
          book_description,
          book_image,
          stockHtml,
          boothHtml,
          sortDate: new Date(book["発行日"]),
          sortPages: Number(book["総頁"] || 0)
        };
        if (book["新刊"] === "1") {
          newBooks.push(record);
        } else {
          oldBooks.push(record);
        }
      });

      const sortRecords = (a, b) => {
        if (b.sortDate - a.sortDate !== 0) return b.sortDate - a.sortDate;
        return b.sortPages - a.sortPages;
      };
      newBooks.sort(sortRecords);
      oldBooks.sort(sortRecords);

      const renderBooks = (booksArray) => {
        return booksArray.map(book => {
          return `
            <article class="book">
              <header class="book_header">
                <h3 class="book_date">${book.book_date}</h3>
              </header>
              <div class="book_image">
                ${book.book_image ? `<img src="${book.book_image}" alt="${book.book_title} 表紙">` : ''}
              </div>
              <div class="book_data">
                <h2 class="book_title">${book.book_title}</h2>
                <p class="book_format">${book.book_format}</p>
                <p class="book_stock">
                  ${book.stockHtml}
                  ${book.boothHtml}
                </p>
                <p class="book_description">${book.book_description}</p>
              </div>
            </article>
          `;
        }).join('');
      };

      document.querySelector('.new-books').innerHTML = renderBooks(newBooks);
      document.querySelector('.old-books').innerHTML = renderBooks(oldBooks);
    })
    .catch(error => console.error('Error loading books.json:', error));

  /* --- お仕事 (works.json) の処理 --- */
  fetch('/data/works.json')
    .then(response => response.json())
    .then(data => {
      data.forEach(work => {
        work.parsedDate = new Date(work.Date);
      });
      data.sort((a, b) => b.parsedDate - a.parsedDate);
      // 年ごとにグループ化
      const groupedWorks = {};
      data.forEach(work => {
        const year = work.parsedDate.getFullYear();
        if (!groupedWorks[year]) groupedWorks[year] = [];
        groupedWorks[year].push(work);
      });
      const years = Object.keys(groupedWorks).sort((a, b) => b - a);
      let worksHTML = '';
      let displayedCount = 0;
      years.forEach(year => {
        let groupHTML = `<div class="year-group"><h3>${year}</h3><ul>`;
        groupedWorks[year].forEach(work => {
          const itemClass = displayedCount < 15 ? '' : 'hidden-item';
          groupHTML += `<li class="${itemClass}">${work.Date} 「<a href="${work.Link}" target="_blank">${work.Work}</a>」 ${work.Jobs}</li>`;
          displayedCount++;
        });
        groupHTML += `</ul></div>`;
        worksHTML += groupHTML;
      });
      document.getElementById('works-list-container').innerHTML = worksHTML;
    })
    .catch(error => console.error('Error loading works.json:', error));

  /* --- 折りたたみ・展開処理 --- */
  const initToggleButtons = () => {
    const buttons = document.querySelectorAll('.toggle-button');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        const targetIdentifier = this.getAttribute('data-target');
        let target = document.getElementById(targetIdentifier);
        if (!target) {
          target = document.querySelector(`.${targetIdentifier}`);
        }
        if (!target) return;
        if (target.classList.contains('expanded')) {
          target.classList.remove('expanded');
          // 再付与: collapsed クラスを対象ごとに追加
          if (targetIdentifier === 'works-list-container') {
            target.classList.add('works-collapsed');
          } else if (targetIdentifier === 'doujinshi-container') {
            target.classList.add('books-collapsed');
          }
          this.textContent = 'もっと表示する';
        } else {
          target.classList.add('expanded');
          // 展開時は collapsed クラスを削除
          if (targetIdentifier === 'works-list-container') {
            target.classList.remove('works-collapsed');
          } else if (targetIdentifier === 'doujinshi-container') {
            target.classList.remove('books-collapsed');
          }
          this.textContent = '閉じる';
        }
      });
    });
  };
  initToggleButtons();
});
