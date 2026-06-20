# showtime.precure.tv

SHOWTIME ―ショウタイム― 公式サイト（v1.0.0）
プリキュアの音楽・フォント・作画を研究する同人サークル「SHOWTIME」のサイトです。

## 構成

| パス | 内容 |
| --- | --- |
| `index.html` | トップページ（同人誌・お仕事はビルドでプリレンダリング） |
| `error.html` | 403 エラーページ |
| `data/books.json` | 同人誌データ |
| `data/works.json` | お仕事・出演・寄稿データ |
| `assets/js/render.js` | 共有レンダリング関数（ブラウザ／ビルド共通） |
| `assets/js/main.js` | ブラウザ用（再描画・折りたたみ UI） |
| `tools/build.mjs` | 静的ビルド（プリレンダリング・JSON-LD・sitemap 更新） |
| `robots.txt` / `sitemap.xml` / `site.webmanifest` | SEO / PWA |
| `og-image.png` / `favicon.svg` ほか | OGP・ファビコン（`tools/make-seo-images.ps1` で再生成） |

## ビルド

`data/*.json` を編集したら、コミット前に再ビルドして `index.html` のプリレンダリング内容と
構造化データ（JSON-LD）、`sitemap.xml` の `lastmod` を更新する。

```sh
npm run build      # = node tools/build.mjs
```

依存パッケージはなし（Node.js 標準モジュールのみ）。`npm install` は不要。

> プリレンダリングにより、JavaScript を実行しないクローラーにも全コンテンツが見えます。
> ブラウザ側 (`main.js`) は同じ `render.js` で再描画するため、データを更新して再ビルドし忘れても
> 閲覧者には最新内容が表示されます（クローラー向け静的内容のみ再ビルドで更新）。

## デプロイ

`data/`・`assets/`・`content/`・各 HTML、およびサイトルートの SEO ファイル
（`robots.txt` / `sitemap.xml` / `site.webmanifest` / `favicon.*` / `og-image.png` / `apple-touch-icon.png` / `icon-*.png`）
を公開ディレクトリへ配置する。

## リリース（git-flow）

`develop` で作業 → `release/vX.Y.Z` を作成 → `VERSION` を更新（「VERSION X.Y.Z」コミット）→
`main` へ `--no-ff` マージ → 注釈付きタグ `vX.Y.Z` → `develop` へタグを戻しマージ。
