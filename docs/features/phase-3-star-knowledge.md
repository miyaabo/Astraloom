# Phase 3 — Star Knowledge

## Status

Done。Automated / Technical Acceptance Criteria は完了(`docs/features/phase-3-implementation-tasks.md` Task 9 参照)。

前フェーズ: `docs/features/phase-2-playback.md`(Done)。2次で確立した「実際の星空を、時間を流しながら好きな速度で眺める」体験を土台にする。見た目のレイヤー(shader・config)・星の位置計算・カメラ/再生エンジンは変更しない前提で進めた(D003)。

## Goal

没入感を壊さず、興味を持った星や星座を知れるようにする。

1次・2次は「実際の星空を正しく再現し、時間を流しながら眺める」がゴールだった。3次では、その星空の上に「星座線・星座名・星名・軽い情報・豆知識」を重ね、Product Vision の「興味を持ったときだけ星・星座・天体の軽い情報や豆知識に触れられる」を実現する。ただし通常状態では星空が主役であることを維持する(Product Principle 2「Relaxation Over Information Density」、5「Calm by Default」)。

## Background / Reference

- `PRODUCT.md` — Product Vision、Product Principle 2/5、Future Capability Inventory: Constellations / Learning
- `DEVELOPMENT.md` — Phase Roadmap: 3次
- `DECISIONS.md` — D003(見た目と位置計算の分離)、D009(オーバーレイ方向の設定UI)、D013(HYG Database 採用、星の固有名は統合済み)
- `docs/features/phase-2-playback.md` — 2次 Small Spec(完了)。球面表示・カメラ・再生エンジンはここで完成済み
- 既存コード: `src/stars/hygCatalogSource.ts`(固有名を含む星データ)、`src/render/StarfieldRenderer.ts`、`src/render/cameraControls.ts`

## Scope

- 星座線(主要な星座の線を球面表示上に描画)
- 星座名の表示
- 星名の表示(HYG Database に含まれる固有名を活用)
- 星・星座の検索(名前から視点を移動)
- 星タップ／クリックによる選択
- 選択した星・星座の軽い基本情報表示(明るさ・色・所属星座など)
- 豆知識(選択時に表示する短いテキスト)

## Out of Scope(3次では作らない)

- 惑星・月・代表的天体の位置表示 — 恒星と異なり軌道計算(暦計算)が必要になり、スコープ・技術方針が大きく変わるため 3次では扱わない(D016 で確定、将来フェーズで再検討)
- 天の川・地平線・風景 — 4次
- BGM・環境音 — 4次
- スリープタイマー・自動 UI 非表示・終了時フェード・表現プリセット — 4次
- お気に入り・保存・共有・動画出力 — 5次
- アカウント・課金 — 6次/7次
- 星・星座の詳細な学術情報(距離・スペクトル分類の専門的解説等)— 「軽い基本情報」「豆知識」の範囲を超えるため対象外

## Technical Direction

- 星座線・星座名データソースとして [d3-celestial](https://github.com/ofrohn/d3-celestial)(Olaf Frohn、BSD-3-Clause)を採用する(D015)。IAU 公式 88 星座を元にした RA/Dec 座標(GeoJSON)の星座線・多言語星座名を提供しており、頂点は HYG の星データと座標近傍マッチングで対応付ける
- 星座線は球面上の2点間を結ぶ線として描画する(2次で確立した球面座標変換・`PerspectiveCamera` をそのまま利用)。既存の星の shader・`starVisualAttributes.ts` は変更しない(D003)
- 星座線は常時表示せず、星・星座を選択したときにその星座の線のみ表示する(D017、Product Principle 5「Calm by Default」)
- 星タップ／クリックは `THREE.Raycaster` 等による 3D ヒットテストを想定。スマホのタップ精度を考慮し、星の見た目サイズより広めの当たり判定を設ける
- 星座名・星名・情報パネルは D009 の方向性(星空画面上へのオーバーレイ)に沿った UI とする。常時表示ではなく、選択時のみ表示することで Product Principle 5「Calm by Default」を維持する
- 検索は本格的な全文検索エンジンを使わず、星座名・星名のリストに対する単純なマッチングで開始する(将来拡張の必要が出た時点で見直す)

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- 星座線データの座標変換・星タップの当たり判定ロジックを unit test で確認する
- console error なし

### Human Check

- 星座線・星座名が過剰にうるさくなく、星空の落ち着きを壊さない(Product Principle 1「Planetarium-like First」)
- 通常状態(未選択時)では星空が主役であり、UI が目立たない
- 星タップ/検索で意図した星・星座を選べる
- 表示される情報・豆知識の分量が「観測アプリ」的になりすぎず、癒し用途に合っている
- PC・スマホ縦画面で破綻しない

## Questions Claude May Ask

Task 1 で以下はすべて人間確認のうえ確定済み(D015〜D017)。

- ~~惑星・月・代表的天体を 3次の Scope に含めるか~~ → 対象外で確定(D016)
- ~~星座線・星座名の外部データソース候補と商用利用条件~~ → d3-celestial を正式採用(D015)
- ~~星座線の見た目(常時表示か選択時のみか)~~ → 選択時のみ表示で確定(D017)。線の太さ・色は Task 3 実装時に Human Check で調整する

小さな実装詳細では質問せず、合理的に判断して進める。
