# Phase 5 — Implementation Tasks

5次開発(`docs/features/phase-5-display-experience.md`)を実装するためのタスク分割。
セッションをまたいで進めるための作業単位であり、Feature Spec 自体の代わりにはならない。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `AGENTS.md`
3. `DEVELOPMENT.md`
4. `docs/features/phase-5-display-experience.md`
5. `docs/features/phase-4-relaxation.md`(4次の前提、Done)
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 既存コード(`src/Starfield.tsx`, `src/render/StarfieldRenderer.ts`, `src/stars/starfieldConfig.ts`, `src/*Overlay.tsx`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ(自動で連続実行しない)。
- Out of Scope(`phase-5-display-experience.md` 参照)には手を出さない。
- 星の見た目の根幹(shader・`starVisualAttributes`)、位置計算、実データソース、惑星追加には踏み込まない。表示体験と既存設定の整理に専念する。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り質問せず合理的に進めてよい。仮定は完了報告に書く。
- Task 1 はフェーズの優先順位・UI 方針に関わるため、人間確認のうえで先へ進む。

## Task List

### Task 1 — 5次スコープ確定 + UI 方針確認

Status: Done

結果(D019): 5次は **鑑賞モード → UI 自動非表示 → 表現プリセット → プロジェクター向け表示補正** の順で進める。4機能はいずれも5次スコープに含めるが、鑑賞モードとプロジェクター補正は別機能として扱う。表現プリセットは `Planetarium-like` を基準に、方向性を壊さない軽い差分のみとし、最大 2 種までに制限する。惑星・月・新規データ導入は引き続き対象外。

- `phase-5-display-experience.md` の Scope 候補(鑑賞モード / UI 自動非表示 / 表現プリセット / プロジェクター向け表示補正)から、5次で実装する機能と優先順位を確定した
- 鑑賞モードとプロジェクター補正の関係は「別機能」で確定した
- 表現プリセットの数と許容幅は「`Planetarium-like` 基準、最大 2 種の軽い差分」で確定した
- 確定した内容を `DECISIONS.md`、`PRODUCT.md`、`phase-5-display-experience.md` へ反映した

完了確認:

- [x] 5次で実装する機能一覧(やらないことも含む)が確定している
- [x] Product Principle 1/5 を壊さない UI 方針が確認されている
- [x] 関連ドキュメントが更新されている

### Task 2 — 表示状態モデルの整理

Status: Done

実装内容: `src/displayState.ts` を新設し、表示状態を `activePanel`(date/location/search の単一アクティブパネル)・`isSelectionInfoOpen`・`mode`(standard/immersive)・`chromeVisibility`(visible/hidden) に分離した。これにより「どのパネルが開いているか」「選択説明が開いているか」「鑑賞モードか」「UI が一時的に隠れているか」を別責務として扱えるようになり、Task 3(鑑賞モード)と Task 4(UI 自動非表示)を同じ state 上に積める。

`Starfield.tsx` は個別の `openOverlay` / `isSelectionInfoOpen` state からこの表示状態モデルを使う形へ置き換えた。現時点では既存挙動を変えず、date/location/search の「同時に 1 パネルだけ開く」ルールと、選択説明の開閉を `displayState` の純粋関数経由で操作する。`selectedStarInfo` 自体は既存どおり別 state に残し、表示状態モデルは「選択データの中身」ではなく「それをどう見せるか」に限定した。

`src/displayState.test.ts` を追加し、以下を unit test で確認した。

- 初期状態
- 単一アクティブパネルの切替
- 選択説明の開閉
- 鑑賞モード移行時の一時 UI クローズ
- `chromeVisibility` と `mode` が別の抑制理由として扱われること
- 自動非表示可能条件(`canAutoHideChrome`)

完了確認:

- [x] 新しい表示状態を既存 UI と衝突せず表現できる
- [x] 状態遷移が unit test で確認されている

### Task 3 — 鑑賞モードの実装

Status: Done

実装内容: `src/Starfield.tsx` に鑑賞モード切替を追加し、`displayState.mode` を実際の UI 抑制へ接続した。鑑賞モード中は Search / DateTime / Location / Playback / StarInfo / Compass / Constellation labels / 次の星座ボタンをまとめて退避し、右下の小さなトグル(`src/ImmersiveModeToggle.tsx`)だけを残して即座に通常表示へ戻れるようにした。

既存の選択系 UI との衝突を避けるため、鑑賞モードへ入る際は現在の選択情報・星座線・ラベルを明示的にクリアし、モード中の canvas tap / 検索選択 / 次の星座操作でも新しい選択 UI を開かないようにした。`src/Starfield.test.tsx` には「主要 UI が隠れること」「復帰できること」「選択中に入っても selection が残骸化しないこと」を追加で確認した。

- 主要 UI をまとめて退避し、星空を優先する鑑賞モードを追加する
- 鑑賞モード中でも必要なときにすぐ通常表示へ戻れる導線を残す
- 星座線・検索・情報表示など、既存の選択系機能との衝突がないか確認する

完了確認:

- [x] 鑑賞モードへの切替/解除ができる
- [x] 鑑賞モードで星空が見やすくなり、操作不能にならない
- [x] PC・スマホで表示崩れがない

### Task 4 — UI 自動非表示の実装

Status: Done

実装内容: `src/Starfield.tsx` に無操作タイマーを追加し、標準モードでは 3 秒間入力がないと `displayState.chromeVisibility` を `hidden` にして主要 UI を自動で退避するようにした。再表示トリガーは `pointerdown` / `pointermove` / `keydown` とし、次の入力で自然に chrome を戻せる。鑑賞モード中は Task 3 の責務を優先し、自動非表示タイマー自体を停止する。

自動非表示の条件整理は既存の `canAutoHideChrome` / `requestChromeAutoHide` / `revealChrome` を利用し、検索パネルや選択情報が開いている間は隠さないままにした。パネルや情報表示を閉じた後は、同じ effect でタイマーを張り直して再び自動非表示できる。`src/Starfield.test.tsx` には「無操作で隠れる」「次の入力で戻る」「パネル open 中は隠れない」「選択情報 open 中は隠れない」を追加した。

- 一定時間入力がないとオーバーレイ類を自動で隠す
- ポインタ、タップ、キーボードなどの再操作で自然に再表示する
- 再生中・検索中・情報閲覧中など、自動非表示してよい状態 / すべきでない状態を整理して実装する

完了確認:

- [x] 自動非表示が意図どおり発火する
- [x] 再表示が直感的で、誤動作しない
- [x] console error がない

### Task 5 — 表現プリセットの最小実装

Status: Done

実装内容: `src/stars/starfieldConfig.ts` に表現プリセット定義を追加し、基準の `Planetarium-like` と、より静かでコントラストを少し締める `Gentle Contrast` の 2 種を一元管理する形にした。差分は星の point size scale、背景色、halo の閾値/強さ、星座線の色/不透明度、天の川と地平線グローの強さに限定し、既存の星データ・位置計算・再生エンジンには手を入れていない。

`src/displayState.ts` に `visualPreset` を追加し、`src/VisualPresetOverlay.tsx` からプリセットを切り替えられるようにした。`src/render/StarfieldRenderer.ts` は `applyVisualPreset()` で clear color と shader/material uniform を差し替え、WebGL context を作り直さず即時反映する。`src/displayState.test.ts` と `src/Starfield.test.tsx` には、プリセット状態遷移と UI 切替の確認を追加した。

- `Planetarium-like` を基準に、軽い見え方の切替を 1〜2 種追加する
- 設定値は `starfieldConfig` など既存の一元管理へ集約する
- 星のサイズ感・明暗差・グロー・背景・ラベル/UI の扱いが基準から外れないよう調整する

完了確認:

- [x] プリセット切替が動作する
- [x] どのプリセットでもプラネタリウム基準から大きく外れていない
- [x] 既存の星データ・位置計算・再生エンジンへ不要な変更を入れていない

### Task 6 — プロジェクター向け表示補正

Status: Done

実装内容: `src/displayState.ts` に `isProjectorMode` を追加し、`src/ProjectorModeToggle.tsx` から独立トグルで切り替えられるようにした。これにより鑑賞モードや表現プリセットとは別に、投影時だけ表示補正を重ねられる。

描画側では `src/stars/starfieldConfig.ts` にプロジェクター向け補正値を集約し、`src/render/StarfieldRenderer.ts` の `applyProjectorMode()` で即時反映する形にした。補正内容は、背景を少し持ち上げて暗部つぶれを抑える、星の point size をわずかに拡大する、halo の強さを少し抑える、天の川と地平線グローを少し持ち上げる、星座線の主張を少し弱める、の最小範囲に限定している。

UI 側では `src/overlayStyles.ts` を CSS variable ベースにし、プロジェクター補正中だけオーバーレイ背景をより薄く・文字コントラストを維持する見た目へ切り替えるようにした。`src/Starfield.test.tsx` と `src/displayState.test.ts` には、独立トグルとして切り替わることと、既存プリセットと衝突しないことを追加で確認した。

- 暗部つぶれ、UI の主張、文字可読性など、投影時に問題になりやすい表示だけを最小限補正する
- 鑑賞モードやプリセットとの重複責務を避ける
- デスクトップ / スマホ通常表示の見た目を壊していないか確認する

完了確認:

- [x] プロジェクター利用を想定した表示補正が機能する
- [x] 通常表示の品質を大きく損なっていない
- [x] Human Check に回せる見た目になっている

### Task 7 — コードレビュー

Status: Done

レビュー結果: Task 4(UI 自動非表示)の仕様と実装が逆転していた。`phase-5-display-experience.md` と Task 4 の定義では、無操作タイマーは標準モードで主要 UI を静かに退避し、鑑賞モードでは Task 3 の責務を優先して自動非表示を止める前提だったが、実装は逆に鑑賞モードでのみタイマーを動かしていた。このため `src/Starfield.tsx` の自動非表示 effect を修正し、標準モードだけで inactivity timer を管理するようにした。

回帰テストとして `src/Starfield.test.tsx` を更新し、以下を確認した。

- 標準モードで無操作 3 秒後に主要 UI が隠れること
- 次の pointer 入力で UI が再表示されること
- 鑑賞モードでは自動非表示しないこと
- パネル open 中/選択情報 open 中は標準モードでも自動非表示しないこと
- 選択情報を閉じた後は再び自動非表示されること

- Task 2〜6 の実装内容をコードレビューし、表示状態の競合、入力系の回帰、モバイルでの破綻、既存フェーズへの副作用を確認する
- 必要な修正と回帰テストを入れる

完了確認:

- [x] 重大な指摘がない、または対応済み

### Task 8 — 自動検証の仕上げ

Status: Done

実施内容:

- `npm run typecheck`
- `npm run lint`
- `npm test`(Vitest 全体)
- `npm run build`
- `npm run test:e2e`(Playwright smoke)

Playwright では `e2e/search-smoke.spec.ts` が、Task 4 の標準モード自動非表示により検索トグルが隠れた状態で再クリックしており 30 秒 timeout していた。これはアプリ不具合ではなく smoke test 側が 5 次の表示仕様を反映できていなかったため、2 回目の検索前に `Shift` keydown で chrome を再表示する 1 手を追加して現行仕様へ合わせた。

確認結果:

- typecheck 成功
- lint 成功
- unit test 成功(22 files / 136 tests)
- production build 成功
- browser smoke test 成功(8 tests, desktop chromium + mobile-chrome)
- console error なし

- typecheck / lint / unit test / production build / browser smoke test を通し、`phase-5-display-experience.md` の Acceptance Criteria(Automated / Technical)を満たすことを確認する

完了確認:

- [x] `phase-5-display-experience.md` の Acceptance Criteria(Automated / Technical)をすべて満たす
- [x] 5次全体が Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
