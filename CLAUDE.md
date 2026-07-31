# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

素の HTML/CSS/JS だけで書かれた、個人開発アプリ4本の紹介ページ集。GitHub Pages の
legacy build（`main` ブランチのルートをそのまま配信）で https://nakakei6439.github.io/ に公開される。

ビルドもテストも依存関係もない。`.html` を直接編集し、push すれば本番に反映される。

## Commands

```bash
# ローカル確認（ビルド不要）
python3 -m http.server 8765
open http://localhost:8765/kondate-cart/

# OGP が JS なしで読めるか（クローラーと同じ条件での確認）
curl -s https://nakakei6439.github.io/kondate-cart/ | grep -E 'og:(title|description|image)"'

# 画像リンク切れの一括確認
for lang in ja en es fr de ko zh-Hans zh-Hant; do for n in 01 02 03 04 05 06; do
  curl -s -o /dev/null -w "$lang/$n %{http_code}\n" \
    "https://nakakei6439.github.io/kondate-cart/assets/screenshots/$lang/$n.png"
done; done

# GitHub Pages のビルド状況（push 後の反映確認。画像を多く足すと数分かかる）
gh api repos/nakakei6439/nakakei6439.github.io/pages/builds --jq '.[0].status'
```

## i18n アーキテクチャ

全ページ8言語対応（`ja` `en` `de` `es` `fr` `ko` `zh-Hans` `zh-Hant`）。
**共通部品への統一が進行中で、まだ3つの方式が混在している。** 触るページがどれかを最初に確認すること。

### 1. 共通部品 `/assets/i18n.js`（移行先。新規はこれを使う）

ページ側は翻訳データ `var I18N = {…}` を持ち、末尾で `FGI18N.init(I18N)` を呼ぶだけ。

| 属性 | 差し込み先 |
|---|---|
| `data-i18n` | `textContent` |
| `data-i18n-html` | `innerHTML`（markup を含む文用） |
| `data-i18n-alt` | `img` の `alt` |
| `data-i18n-label` | `aria-label` |
| `data-i18n-src` | `img` の `src` |

`data-i18n-src` **だけは辞書を引かない**。値はパスそのもので、含まれる `{lang}` が現在の
言語コードに置換される（`./assets/screenshots/{lang}/01.png`）。8言語ぶんのパスを辞書に
並べずに済ませるための仕組み。

言語の判定順は `?lang=xx` → `localStorage("site-lang")` → `navigator.languages` → `en`。
`?lang=xx` で来た場合はその言語を保存する。旧キー `fg_lang` / `ct_lang` は初回に
`site-lang` へ自動移行し、旧キーは削除される。右上の切替プルダウン（`#fg-lang-switch`）は
部品側が自動で挿入するので、ページ側にUIを書かない。

### 2. `data-lang` 方式（`kondate-cart/how-to-use.html` のみ）

8言語ぶんの本文HTMLを丸ごと重複させ、`[data-lang].visible` の CSS で出し分ける。
1443行のうち大半がこの重複。集約は全アプリの移行が終わった最後にまとめて行う予定。

### 現状の対応表

| ページ | i18n方式 | OGP |
|---|---|---|
| `index.html`（トップ） | **共通部品** | なし |
| `focus-gym/index.html` | **共通部品** | **英語で直書き済み** |
| `focus-gym/{privacy,terms,evidence}.html` | **共通部品** | なし |
| `kondate-cart/index.html` | **共通部品** | **英語で直書き済み** |
| `kondate-cart/privacy-policy.html` | **共通部品** | なし |
| `kondate-cart/how-to-use.html` | `data-lang` 方式 | なし |
| `tabememo/{index,privacy}.html` | インライン実装 / `site-lang` | なし |
| `Code-Tweet/index.html` | インライン実装 / `ct_lang` | **日本語。要英語化** |
| `Code-Tweet/{how-to-use,privacy-policy}.html` | 多言語化なし | なし |

スクショ欄の実装例は `focus-gym/index.html`（8枚）と `kondate-cart/index.html`（6枚）。
どちらも `data-i18n-src` で言語連動し、`alt` は既存の機能名キーを流用している。

## OGP の方針

**OGP は `<head>` に英語で直書きし、JavaScript で書き換えない。**
クローラーは JS を実行しないため、JSで `og:` を差し替えても効果がないため。

閲覧者向けの表示（`<title>` や本文）は従来どおり言語で切り替わり、`og:` / `twitter:` だけが
英語で固定される、という住み分けにする。実装例は `kondate-cart/index.html` の `<head>`。

`Code-Tweet/index.html` は現在この方針に反しており、日本語の `og:` を持ち、979〜982行目付近の
インラインJSが言語切替時に `og:title` / `og:description` を書き換えている。
Code-Tweet の番になったら og: を英語化し、この書き換えJSを削除する。

## 画像素材

元データはこのリポジトリにはなく、各アプリのソースリポジトリにある。
Web用に縮小・圧縮してから `<app>/assets/` 配下へ配置する。

| アプリ | 素材の場所（`~/Products/iOSApp/` 配下） |
|---|---|
| 献立カート | `KondateCart/resources/assets/appstore-screenshots/<lang>/1125x2436/`、`.../producthunt/en/` |
| フォーカスジム | `FocusGym/resources/assets/screenshots/ja/`、`FocusGym/resources/assets/producthunt/en/` |
| 食べメモ | `TabeMemo/resources/assets/screenshots/` |
| Code Tweet | `Code-Tweet/docs/ad-assets/*.png` |

```bash
# OGP画像: 2540x1520 の Product Hunt バナー -> 中央で切って 1200x630 へ
sips -c 1334 2540 <元画像> --out /tmp/og-crop.png
sips -z 630 1200 /tmp/og-crop.png --out <app>/assets/og.png

# スクリーンショット: 1125x2436 -> 幅600px（表示は200px幅なので3x相当）
sips -Z 1300 <元画像> --out <app>/assets/screenshots/<lang>/01.png

# 圧縮。必須。これを飛ばすとリポジトリが数十MB増える（26MB -> 4MB の実績）
# 対象は screenshots 配下と og.png に限る。assets 全体にかけないこと。
find <app>/assets/screenshots -name '*.png' -print0 \
  | xargs -0 -n1 pngquant --quality=60-88 --speed 1 --force --ext .png --skip-if-larger
pngquant --quality=60-88 --speed 1 --force --ext .png --skip-if-larger <app>/assets/og.png
```

`icon.png` にはかけないこと。パステル調のなめらかなグラデーションは256色に落とすと
バンディングが出る（`focus-gym/assets/icon.png` で実際に発生させ、revert した）。
写真やUIスクショは問題ないが、なめらかなグラデーションが主体の画像は目視で確認してから採用する。

中国語のフォルダ名は素材側が `zh-Hans（简体）` のようになっているが、URL に非ASCIIが
入らないよう `zh-Hans` / `zh-Hant` に正規化して配置する。

スクショは `data-i18n-src` で言語連動させるため、訪問者は表示中の言語の6枚しか
読み込まない。多言語化してもページの表示速度は変わらず、増えるのはリポジトリ容量だけ。

## 編集時の制約

- **`data-i18n` / `data-i18n-alt` が付いた本文は変更しない。** 既存の翻訳文はそのまま温存する。
  新しいキーが必要になったら、まず既存の辞書や他ページに使える訳語がないか探すこと
  （`screenshotsLabel` は `focus-gym/index.html` の8言語ぶんを流用した実績がある）。
- 既存の配色・トーン・レイアウトは維持する。スクショ欄の体裁は `focus-gym/index.html` の
  `.screenshots`（横スクロール、`img` は幅200px）に合わせる。
- 翻訳データ `var I18N = {…}` の言語キーの並び順はページごとに違う。行番号で挿入する
  スクリプトを書くときは、必ず挿入前に `assert` で対象行を検証すること。

## リリース手順

`~/.claude/CLAUDE.md` のルールにより、**push の前に `README.md` を更新する**。
README は Code Tweet（https://code-tweet.vercel.app/）が宣伝素材を生成する入力になるため、
古いままだと生成物も古くなる。「push 後に README を直す」は不可。

README 更新 → commit → push の順。push すると GitHub Pages に即座に公開される。
