# Phase 7 — Celestial Bodies

## Status

Task 1(スコープ確定・Small Spec 作成)完了。7次では、保存同期より先に、**惑星・月・主要天体の表示** を整える。

前フェーズ: `docs/features/phase-6-save-and-resume.md`(Done)。6次で保存体験は整ったため、次は画面に見える空そのものを強くする。

## Goal

恒星中心の星空に、惑星・月・主要天体を自然に追加し、表示体験を一段進める。

現時点の Veluna は、恒星、星座、天の川、地平線、再生、視点移動、保存再開までを備えている。一方で、実際に夜空で目立つ惑星や月はまだ表示されておらず、空としての再現は未完成である。7次では、まず UI 拡張より先に、主要天体を静かに追加する。既存の星空表現の落ち着きは維持し、情報量を急に増やさない。

## Background / Reference

- `PRODUCT.md` — Product Vision、Product Principle 1/2/5/6、Current Phase
- `DEVELOPMENT.md` — Phase Roadmap: 7次
- `DECISIONS.md` — D003(見た目と位置計算の分離)、D016(3次では惑星等を対象外にした判断)、D022(7次スコープ)、D023(データソース/対象天体)
- `docs/features/phase-3-star-knowledge.md` — 3次 Small Spec(Done)
- `docs/features/phase-6-save-and-resume.md` — 6次 Small Spec(Done)
- 既存コード: `src/astronomy/coordinates.ts`, `src/Starfield.tsx`, `src/render/StarfieldRenderer.ts`, `src/search/`

## Scope(Task 1 で確定 — D022)

- **惑星の位置表示**
  - 初手は水星・金星・火星・木星・土星を対象にする
- **月の位置表示**
  - 日時・観測地点に応じた位置表示
- **主要天体の最低限の見え方調整**
  - 恒星とは別の見え方差分を持てるようにする
- **既存導線への最小統合**
  - 検索
  - 選択
  - 軽い情報表示
- **責務分離**
  - 恒星データ系と主要天体系を分離する

### 7次で優先する技術論点

- 主要天体データソースと商用利用条件
- 惑星・月の位置計算方式
- 既存の恒星 renderer への統合方法
- 検索・選択モデルへの拡張方法
- 表示品質の静かさ

## Out of Scope(7次では作らない)

- アカウント認証
- 複数端末同期
- クラウド保存
- 共有リンク
- シーン共有
- 課金
- UI の全面的な作り直し
- 天体の詳細な学術情報

上記は「不要」ではなく、7次の初手では扱わない。

## Technical Direction

- 惑星・月は恒星と異なる計算責務を持つため、既存の HYG 恒星データ処理へ直接混ぜず、別モジュールとして追加する
- 既存の星空描画 shader と表示品質を壊さないことを優先し、主要天体の描画差分は最小にする
- まずは「自然に見えること」を優先し、詳細情報や複雑な UI は後回しにする
- データソースや計算方式は商用利用可能性を確認した上で選ぶ
- 既存の検索・選択導線は再利用するが、通常状態では情報過多にならないよう維持する
- 位置計算ライブラリには Astronomy Engine を採用し、Veluna 側では runtime state / render input / search input の 3 層へ分けて受ける(D023)

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- 主要天体の位置計算を unit test で確認する
- 既存の恒星・検索・選択機能に重大な回帰がない
- console error なし

### Human Check

- 惑星・月が不自然に派手すぎず、夜空として自然に見える
- 恒星中心の落ち着いた見え方が壊れていない
- 検索や選択から主要天体へ違和感なく移動できる
- PC・スマホ縦画面で破綻しない

## Questions Claude May Ask

Task 1 で以下は確定済み(D022)。

- 7次の初手は何か → 惑星・月・主要天体の表示
- UI を先に作り込むか → 作り込まない
- 保存同期や課金を同時に進めるか → 進めない

主要天体データソース、計算方式、対象天体の絞り込みなど、変更コストが高い判断は Task 2 の調査結果を踏まえて必要時に確認する。
