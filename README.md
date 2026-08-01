# nakakei6439.github.io

個人開発アプリの紹介ページ集（GitHub Pages）。
公開URL: https://nakakei6439.github.io/

## 収録ページ

| ディレクトリ | アプリ | 配布先 | ページ |
|---|---|---|---|
| `kondate-cart/` | 献立カート（KondateCart） | [App Store](https://apps.apple.com/app/id6760213937) | トップ / プライバシーポリシー / 使い方ガイド |
| `focus-gym/` | フォーカスジム（FocusGym） | iOS | トップ / プライバシー / 利用規約 / エビデンス |
| `tabememo/` | 食べメモ（TabeMemo） | [App Store](https://apps.apple.com/app/id6787073935) | トップ / プライバシー |
| `Code-Tweet/` | Code Tweet | [Web](https://code-tweet.vercel.app/) | トップ / プライバシーポリシー / 使い方ガイド |

全ページ 8言語対応（日本語・英語・ドイツ語・スペイン語・フランス語・韓国語・簡体字・繁体字）。

## 共通の言語切替部品 `/assets/i18n.js`

各ページに散らばっていた言語切替の実装を1本にまとめたもの。
ページ側は翻訳データを持ち、末尾で `FGI18N.init(I18N)` を呼ぶだけ。

```html
<script src="/assets/i18n.js"></script>
<script>
  var I18N = {
    ja: { pageTitle: "…", appName: "…" },
    en: { pageTitle: "…", appName: "…" }
    // de / es / fr / ko / zh-Hans / zh-Hant
  };
  FGI18N.init(I18N);
</script>
```

### 差し込み用の属性

| 属性 | 差し込み先 | 例 |
|---|---|---|
| `data-i18n` | `textContent` | `<h1 data-i18n="appName">献立カート</h1>` |
| `data-i18n-html` | `innerHTML`（リンク等の markup 用） | `<p data-i18n-html="notice">…</p>` |
| `data-i18n-alt` | `img` の `alt` | `<img data-i18n-alt="appIconAlt" alt="…">` |
| `data-i18n-label` | `aria-label` | `<button data-i18n-label="closeBtn">` |
| `data-i18n-src` | `img` の `src`（**辞書を引かず**パス中の `{lang}` を置換） | `<img data-i18n-src="./assets/screenshots/{lang}/01.png">` |

キーはドット区切りで入れ子をたどれる（`data-i18n-html="hero.eyebrow"`）。
平坦なキーにドットは現れないので、両方の書き方が混在しても問題ない。

ページが自前の切替UIを持つ場合は、その `<select>` に `data-i18n-switcher` を付ける。
部品はそれに接続し、自前のUIを注入しない（暗色テーマのページで配色の合わないUIが
重なるのを避けるため。`Code-Tweet/index.html` が該当）。

`html:not(.i18n-ready) body { opacity: 0 }` を置いているページでは、
適用完了後に部品が `<html>` へ `i18n-ready` を付けるので、切替前のチラつきが出ない。

`data-i18n-src` だけは他と仕組みが違う。値は辞書キーではなくパスそのもので、
`{lang}` が現在の言語コードに置き換わる。8言語ぶんのパスを辞書に並べずに済む。

### 言語の決定と保存

判定順は `?lang=xx` → `localStorage("site-lang")` → `navigator.languages` → `en`。

- `?lang=xx` で来た場合はその言語を **保存する**（SNSから `?lang=en` で来た人が次回も英語で開ける）
- 旧キー `fg_lang` / `ct_lang` は初回アクセス時に `site-lang` へ自動移行し、旧キーは削除する
- 右上に言語切替のプルダウンを自動で挿入する（`#fg-lang-switch`）

## OGP（SNSサムネイル）の方針

**OGP は HTML に英語で直書きし、JavaScript で書き換えない。**
クローラーは JS を実行しないため、JSで og: を差し替えても意味がないため。

閲覧者向けの表示（`<title>` や本文）は従来どおり言語で切り替わる。
`og:` / `twitter:` だけが英語で固定される、という住み分け。

og:image は 1200×630。`kondate-cart/assets/og.png` が実装例。

## 画像素材の作り方

素材の元データは別リポジトリ（`~/Products/iOSApp/<AppName>/resources/assets/`）にある。
Web用には縮小・圧縮してから配置する。

```bash
# OGP画像: 2540x1520 のバナー -> 中央で切って 1200x630 へ
sips -c 1334 2540 <元画像> --out /tmp/og-crop.png
sips -z 630 1200 /tmp/og-crop.png --out kondate-cart/assets/og.png

# スクリーンショット: 1125x2436 -> 幅600px（表示は200px幅なので3x相当）
sips -Z 1300 <元画像> --out <出力先>/01.png

# 圧縮（見た目を保ったまま 1/6 程度になる）
find kondate-cart/assets -name '*.png' -print0 \
  | xargs -0 -n1 pngquant --quality=60-88 --speed 1 --force --ext .png --skip-if-larger
```

スクショは `assets/screenshots/<言語>/01.png`〜`06.png` の形で置く。
中国語のフォルダ名は URL に非ASCIIが入らないよう `zh-Hans` / `zh-Hant` に正規化する。

訪問者のブラウザは表示中の言語の6枚しか読み込まないため、多言語化してもページは重くならない。

## ローカルでの確認

```bash
python3 -m http.server 8765
open http://localhost:8765/kondate-cart/
```

確認項目:

- 右上の言語プルダウンが出る
- 言語を切り替えると本文とスクショ画像が両方入れ替わる
- 再読み込みしても選んだ言語が維持される（`site-lang`）
- `?lang=en` で開くと英語になり、次回も英語のままになる
- `curl -s <URL> | grep 'og:'` で og: が英語で読めること（JSなしで確認）

## 作業の進捗

Product Hunt / X ローンチ向けの整備を、アプリごとに順番に進めている。

- [x] **献立カート** — OGP追加 / スクショ欄新設（8言語×6枚、言語連動）/ 共通部品へ移行
- [x] **フォーカスジム** — OGP追加 / スクショを新UIの8枚へ差し替え（8言語連動）/ 共通部品へ移行
- [x] **トップページ** — 共通部品へ移行（独自の切替UIを廃止し、部品が注入するものに統一）
- [x] **旧 `focus-gym/assets/i18n.js` を削除**（参照元が無くなったため）
- [x] **食べメモ** — OGP追加 / スクショ欄新設（8言語×6枚、言語連動）/ 共通部品へ移行
- [x] **Code Tweet** — 日本語og:を英語へ置換 / og:を書き換えるインラインJSを削除 / 新アイコン追加 / 共通部品へ移行
- [x] **`kondate-cart/how-to-use.html` の集約** — 8言語ぶんのHTML重複を1つの骨組みに（1443行 → 843行）

これで全11ページが共通部品に統一され、インライン実装は残っていない。

Code Tweet はスクショ欄を設けていない。本番 `code-tweet.vercel.app` が日本語しか返さず
（8言語ルーティングは作業ブランチ止まりで、英語メッセージも nav/footer 等22件のみ）、
海外向けローンチに載せられる英語のスクショが撮れないため。Web アプリでリンクから
実物をすぐ見られる点も踏まえ、欄ごと見送っている。

## ライセンス

© 2026 Keita Nakagawa. All rights reserved.
