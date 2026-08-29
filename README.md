# Veluna

## Overview

Veluna は、就寝前などに本格感のある夜空を静かに眺めてリフレッシュするための Web アプリ。

最終的には、世界中の場所と日時を指定して、その時の星空を再現し、時間を流しながら星の動きをぼーっと眺められる体験を目指す。

ただし、いわゆる観測特化アプリではなく、**プラネタリウムのように「ちゃんとした夜空」に見え、落ち着いて眺められること**を重視する。

## Current Phase

**0次開発 — プラネタリウム基準の星空表現を成立させる**

0次開発の目的は、機能を増やすことではなく、完成系につながる星空表現の品質を確立すること。

### 0次 Success Criteria

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

## Development Documents

- `PRODUCT.md` — プロダクトの目的・原則・スコープ
- `CLAUDE.md` — Claude Code が常時守る指示
- `DEVELOPMENT.md` — 標準開発フローとフェーズ順
- `DECISIONS.md` — 重要な技術判断
- `docs/features/phase-0-starfield.md` — 0次開発の Small Spec
- `docs/references/phase-0-visual-target.png` — 0次開発の Visual Target

## Git Policy

初期試作中は Git 管理を必須としない。

星空表現がある程度成立し、ユーザーが「継続開発する」と判断した段階で Git / GitHub 管理を開始する。

Claude Code は、ユーザーから明示されるまで Git 初期化・GitHub リポジトリ作成・push を勝手に行わない。

## Deployment

現時点では未決定。

0次開発ではローカル実行を優先する。一般公開が視野に入った段階で、静的配信・将来の API / 認証 / 課金との相性を見て選定する。
