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

ホスティングは **AWS S3 + CloudFront**。初回のみ雛形をコピーして値（バケット名・CloudFront ID・
AWS プロファイル）を設定する。`deploy.sh` / `deploy.ps1` は `.gitignore` 対象。

```sh
cp deploy.sh.example deploy.sh   # 値を編集（Windows は deploy.ps1.example）
npm run build                     # data 更新時は先にビルド
./deploy.sh                       # S3 sync(除外/Cache-Control) → webmanifest content-type → CloudFront 無効化
```

開発用ファイル（`.git` / `.resources` / `tools` / `README.md` / `package.json` / `VERSION` 等）は
sync 時に除外される。表紙・ロゴ画像（`assets/images` / `content/images`）は git 管理外だがローカルに
あるため sync 対象。

## リリース（git-flow）

`develop` で作業 → `release/vX.Y.Z` を作成 → `VERSION` を更新（「VERSION X.Y.Z」コミット）→
`main` へ `--no-ff` マージ → 注釈付きタグ `vX.Y.Z` → `develop` へタグを戻しマージ。
