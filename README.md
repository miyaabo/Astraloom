# Veluna

## Overview

Veluna は、就寝前などに本格感のある夜空を静かに眺めてリフレッシュするための Web アプリ。

最終的には、世界中の場所と日時を指定して、その時の星空を再現し、時間を流しながら星の動きをぼーっと眺められる体験を目指す。

ただし、いわゆる観測特化アプリではなく、**プラネタリウムのように「ちゃんとした夜空」に見え、落ち着いて眺められること**を重視する。

## Current Phase

**4次開発 — 癒し体験の強化(Small Spec 作成済み、実装未着手)**

星空を自分好みのリラックス空間にできるようにする。音・映像アセット・タイマー系など技術領域の異なる候補群を含むため、Task 1(スコープ確定)を人間確認のうえ完了させてから実装に着手する。

詳細は `docs/features/phase-4-relaxation.md`、進め方は `docs/features/phase-4-implementation-tasks.md` を参照。

### 3次(完了済み)で達成した内容

没入感を壊さず、興味を持った星や星座を知れるようにした。星座線・星座名・星名・検索・星タップによる基本情報表示・豆知識を実装済み。

- d3-celestial 由来の星座線・星座名データを HYG の星と座標マッチングして導入(`src/constellations/`)
- 星座線の球面描画(選択時のみ表示、`StarfieldRenderer` の `LineSegments` レイヤー)
- 星座名・星名ラベル表示(英名+日本語名、重なり回避付き、`ConstellationLabelsOverlay.tsx`)
- 星タップ/クリックによる選択と基本情報表示(明るさ・色を言葉で表現、`StarInfoOverlay.tsx`)
- 星・星座の検索(`src/search/`, `SearchOverlay.tsx`)、「次の星座を表示する」ボタン(`NextConstellationButton.tsx`)
- 星座・星の豆知識(`constellationTrivia.ts`, `starTrivia.ts`)
- コードレビューでの不具合修正(ラベルちらつき回帰、検索の取りこぼし、パフォーマンス、重複コード整理)

自動検証(typecheck / lint / unit test 104件 / production build / e2e 8件)すべて成功、console error なし。詳細は `docs/features/phase-3-star-knowledge.md`、進め方は `docs/features/phase-3-implementation-tasks.md` を参照。

### 2次(完了済み)で達成した内容

実際の星の動きを、好きな速度で再生・停止・巻き戻ししながら眺められるようにした。球面表示・視点移動・ズームも実装済み。

- 実データの alt/az を球面座標へ変換し、`PerspectiveCamera` による球面表示へ移行(`src/stars/skyProjection.ts`)
- ドラッグ・ホイール操作による視点移動・ズーム(`src/render/cameraControls.ts`)
- 再生／停止・速度プリセット・巻き戻しの再生エンジンと UI(`src/playback/`, `src/PlaybackOverlay.tsx`)
- 再生中の星位置再計算を間引くパフォーマンス対応(モバイル相当負荷での計測に基づく)
- 日時・場所・再生・方位(コンパス)のオーバーレイ UI 整理(`src/overlayStyles.ts` に共通スタイル集約)

自動検証(typecheck / lint / unit test / production build / e2e)・Human Check とも完了。詳細は `docs/features/phase-2-playback.md`、進め方は `docs/features/phase-2-implementation-tasks.md` を参照。

### 1次(完了済み)で達成した内容

信頼できる実データを土台に、指定した場所と日時に対応する星空を再現する。0次で確立した星の見た目(色・明るさ・サイズ・グロー・瞬き)はそのまま引き継ぎ、星の位置計算を仮データから実データ + 天文計算へ置き換えた。

- HYG Database 由来の実星データ(`src/stars/data/hygCatalog.json`)から星空を描画
- 恒星時計算・赤道座標 → 地平座標(alt/az)変換(`src/astronomy/coordinates.ts`)
- 日時指定 UI・場所指定 UI(星空画面上のオーバーレイ、`src/DateTimeOverlay.tsx` / `src/LocationOverlay.tsx`)
- タイムゾーンを考慮した日時計算(`src/civilTime.ts`)
- 自動検証・Human Check 完了

詳細は `docs/features/phase-1-real-sky.md`(Done)、進め方は `docs/features/phase-1-implementation-tasks.md` を参照。

### 0次(完了済み)で達成した内容

- 見た瞬間に「夜空」かつ「プラネタリウムらしい」と感じられる
- 星が大きすぎる発光玉ではなく、**小さくシャープな点**を基調としている
- 明るい星と暗い星に自然な階層がある
- ごく明るい星だけに、控えめで自然なにじみがある
- 色は白中心で、一部の明るい星に自然な色差がある
- 背景は暗く落ち着いていて、星が映える
- PC とスマホ縦画面で、同じ方向性の品質がある
- 少なくとも 1 分程度、控えめに動き続けても演出がうるさくない
- Human Check で「この見た目なら先を作りたい」と判断できる

詳細は `docs/features/phase-0-starfield.md` を参照。

## Visual Reference

0次開発では、以下の画像を **Visual Target** として扱う。

- `docs/references/phase-0-visual-target.png`

この画像は単なる雰囲気参考ではない。完全コピーは不要だが、少なくとも以下はこの方向性から大きく外れないこと。

- 星のサイズ感
- 明暗差
- グローの強さ
- 背景の暗さ
- 全体の密度感
- 「プラネタリウムらしい」見え方

## Core Technology

0次開発では以下を採用する。

- TypeScript
- React
- Vite
- Three.js / WebGL
- custom shader（星のサイズ・明るさ・色・にじみ・瞬き表現）
- Vitest
- Playwright（最低限の表示確認）
- ESLint / Prettier

詳細な採用理由は `DECISIONS.md` を参照。

## Target Environments

0次開発:

- Windows 11 + Chrome を基準環境とする
- スマホ Chrome / Safari
- スマホは縦画面を優先
- PC とスマホで表現思想は揃える
- 端末性能差は内部的な描画品質調整で吸収する

将来の主利用イメージ:

```text
スマホ Web アプリ
    ↓ AirPlay ミラーリング
Nebula Capsule 3 Laser
    ↓
プロジェクターで星空を鑑賞
```

専用キャスト機能は初期段階では作らない。

## Setup

```bash
npm install
npm run dev
```

品質確認:

```bash
npm run typecheck     # tsc -b --noEmit
npm run lint          # eslint .
npm run format:check  # prettier --check .
npm run test          # vitest run
npm run build         # tsc -b && vite build
npm run test:e2e      # playwright test（dist の build が必須。初回は `npx playwright install` も必要）
```

## Data Attribution

星データは [HYG Database](https://codeberg.org/astronexus/hyg)(astronexus、CC BY-SA 4.0)を採用している(`DECISIONS.md` D013)。

`src/stars/data/hygCatalog.json` は、視等級 6.5 以下でフィルタした軽量版を `scripts/build-hyg-catalog.mjs` で生成したもの。再生成方法はスクリプト冒頭のコメントを参照。

星座線・星座名データは [d3-celestial](https://github.com/ofrohn/d3-celestial)(Olaf Frohn、BSD-3-Clause)を採用している(`DECISIONS.md` D015)。

`src/constellations/data/constellationCatalog.json` は、星座線の頂点を HYG カタログの星 ID に対応付けた軽量版を `scripts/build-constellation-catalog.mjs` で生成したもの。再生成方法はスクリプト冒頭のコメントを参照。

## Development Documents

- `PRODUCT.md` — プロダクトの目的・原則・スコープ
- `CLAUDE.md` — Claude Code が常時守る指示
- `DEVELOPMENT.md` — 標準開発フローとフェーズ順
- `DECISIONS.md` — 重要な技術判断
- `docs/features/phase-0-starfield.md` — 0次開発の Small Spec(Done)
- `docs/references/phase-0-visual-target.png` — 0次開発の Visual Target
- `docs/features/phase-1-real-sky.md` — 1次開発の Small Spec(Done)
- `docs/features/phase-1-implementation-tasks.md` — 1次開発のタスク分割
- `docs/features/phase-2-playback.md` — 2次開発の Small Spec(Done)
- `docs/features/phase-2-implementation-tasks.md` — 2次開発のタスク分割
- `docs/features/phase-3-star-knowledge.md` — 3次開発の Small Spec(Done)
- `docs/features/phase-3-implementation-tasks.md` — 3次開発のタスク分割
- `docs/features/phase-4-relaxation.md` — 4次開発の Small Spec
- `docs/features/phase-4-implementation-tasks.md` — 4次開発のタスク分割(実装未着手)

## Git Policy

初期試作中は Git 管理を必須としない。

星空表現がある程度成立し、ユーザーが「継続開発する」と判断した段階で Git / GitHub 管理を開始する。

Claude Code は、ユーザーから明示されるまで Git 初期化・GitHub リポジトリ作成・push を勝手に行わない。

## Deployment

現時点では未決定。

0次開発ではローカル実行を優先する。一般公開が視野に入った段階で、静的配信・将来の API / 認証 / 課金との相性を見て選定する。
