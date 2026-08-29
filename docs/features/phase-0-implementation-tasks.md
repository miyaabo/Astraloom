# Phase 0 — Implementation Tasks

0次開発(`docs/features/phase-0-starfield.md`)を実装するためのタスク分割。
セッションをまたいで進めるための作業単位であり、Feature Spec 自体の代わりにはならない。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `CLAUDE.md`
3. `DEVELOPMENT.md`
4. `docs/features/phase-0-starfield.md`
5. `docs/references/phase-0-visual-target.png`
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 既存コード(ある場合)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ(自動で連続実行しない)。
- Out of Scope(`phase-0-starfield.md` 参照)には手を出さない。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り質問せず合理的に進めてよい。仮定は完了報告に書く。

## Task List

### Task 1 — プロジェクト初期化

Status: Done

- Vite + React + TypeScript scaffold(`npm create vite@latest . -- --template react-ts`)
- 依存追加: `three`, `@types/three`
- 品質基盤: ESLint, Prettier, Vitest, Playwright のセットアップ
- `README.md` の Setup コマンドを実態に合わせて更新

完了確認:
- `npm run dev` で空ページが起動する
- typecheck / lint が通る

### Task 2 — 星データ & config 基盤

Status: Done

- `src/stars/starTypes.ts` — 星データの型定義
- `src/stars/starDataSource.ts` — 仮星データ生成(position / brightness / color category / twinkle phase・amplitude / size variance)。配置ロジックは見た目パラメータに依存させない
- `src/stars/starfieldConfig.ts` — 星空表現の調整値を一元管理(D004)

完了確認:
- unit test で brightness 分布・値の範囲・データ件数を確認
- まだ画面表示はしない

### Task 3 — Three.js renderer 最小実装

Status: Done

- `src/render/StarfieldRenderer.ts` — Three.js scene / OrthographicCamera / BufferGeometry / 最小 shader(まずは単純な点でよい)
- `src/Starfield.tsx` — React とのライフサイクル橋渡し(canvas ref、mount/unmount)
- `App.tsx` を Starfield 表示のみのシンプルな shell にする

完了確認:
- ブラウザで星(ラフな点)が画面に表示される
- Human Check(見た目の作り込みはまだ先でよい)

### Task 4 — シェーダーで見た目を作り込む

Status: Done (Human Check 待ち)

- custom `ShaderMaterial` で core(シャープな点)+ halo(明るい星のみの控えめなにじみ)を分離
- 明暗階層、色差(白中心 + 一部青白/淡橙)、size のバリエーションを Visual Target に近づける
- 背景の暗く落ち着いた配色を実装

完了確認:
- Visual Target(`docs/references/phase-0-visual-target.png`)との方向性比較 Human Check
- `phase-0-starfield.md` の Human Check 項目 1〜8 を目視確認

### Task 5 — アニメーション

Status: Done (Human Check 待ち)

- twinkle(星ごとに phase をずらし、振幅は brightness に応じて小さく)
- ごく緩やかな全体 drift(大きく流れる/速く回転する演出は禁止)
- `prefers-reduced-motion` 対応(停止ではなく大幅減衰)

完了確認:
- 1 分間動作させて破綻・うるささがないか Human Check
- `phase-0-starfield.md` の Human Check 項目 9〜10 を確認

### Task 6 — レスポンシブ対応

Status: Done (Human Check 待ち)

- resize / orientation change でカメラ frustum と renderer size を安全に再計算
- DPR cap(config 経由)
- background tab で描画ループを止める(visibilitychange)
- モバイル縦画面での確認

完了確認:
- PC Chrome とスマホ縦画面で破綻がない
- `phase-0-starfield.md` の Human Check 項目 11〜13 を確認

### Task 7 — コードレビュー

Status: In Progress

- `/code-review` で Task 1〜6 の差分をレビュー(責務分離が守られているか、shader 内のマジックナンバー化、不要な抽象化・依存がないか等)
- 指摘があれば修正し、再確認する

完了確認:
- 重大な指摘がない、または対応済み
- CLAUDE.md の Coding Rules(strict TypeScript, 責務分離, マジックナンバー禁止 等)に沿っている

### Task 8 — 自動検証の仕上げ

Status: Not Started

- Playwright smoke test(ページロード、canvas 存在、console error なし)
- typecheck / lint / unit test / production build を一通り実行し確認
- README の記載を最終状態に更新

完了確認:
- `phase-0-starfield.md` の Acceptance Criteria(Automated / Technical)をすべて満たす
- Phase 0 全体の Human Check(Must Pass 全項目)に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
