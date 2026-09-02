# Phase 10 — 雰囲気プリセット / 表現設定 — Implementation Tasks

Veluna の次フェーズとして、夜空の雰囲気を切り替えて楽しめる体験を整えるためのタスク分割。
この段階では、認証や DB 保存より先に、**どんな夜空体験を見せたいか** を固める。

## 目的

Veluna の星空を「同じ空をただ表示する」状態から一歩進め、落ち着いた鑑賞向け、少しコントラストを立てた見え方、夜間向け UI など、**雰囲気の異なる夜空体験** を切り替えられる基盤を整える。

他のプラネタリウムアプリにある表示切替・夜間モード・ラベル表示調整のような機能群を参考にしつつ、Veluna では Product Principle 1 と 2 を守り、派手すぎない範囲で実装する。

## 前提

- 5次で軽い表現プリセットとプロジェクター補正は導入済み
- 次フェーズではそれを拡張し、「設定できる項目」と「ユーザーに見せるプリセット」の整理を先に行う
- 同時に、他アプリにある表示切替系の機能のうち、今後 Veluna で必要になるものを棚卸しする

## Task List

### Task 1 — 10次スコープ確定 + Small Spec 作成

Status: Done

結果(D028): 10次は雰囲気プリセットの方向性整理・設定可能な表示項目の棚卸し・他アプリにある表示切替系機能の振り分け・最小の設定 UI 方針・保存対象との接続整理を扱う。認証・同期・課金(8次/9次/12次)、新規データ導入、大規模な設定画面の新規設計は含めない。`docs/features/phase-10-atmosphere-presets.md` を Small Spec として新規作成した。プリセットの具体的な種類・数や UI 構成は Task 2 以降で個別に決める。

- 10次で扱う内容を `雰囲気プリセット / 表現設定 / 夜間モード候補 / 表示項目の整理` に絞る
- 他アプリにある表示切替系機能のうち、Veluna で今やるもの・後でやるものを分ける
- Goal / Acceptance Criteria / Out of Scope を文書化する

完了確認:

- [x] 10次の Small Spec が作成されている
- [x] 10次でやること / やらないことが明確

### Task 2 — 設定可能項目の棚卸し

Status: Done

結果: `docs/features/phase-10-atmosphere-presets.md` に「設定可能項目の棚卸し(Task 2)」を追加した。既存実装(`starfieldConfig.ts` / `displayState.ts` / `sceneState.ts` / 各 Overlay/Toggle)を A(既にユーザー向け UI がある項目)・B(内部パラメータ)・C(表示可否の切替)・D(保存対象)の 4 区分に整理した。

- A: 表現プリセット・鑑賞モード・プロジェクター補正・UI 自動非表示(5次で確立済み、10次はこの上に拡張)
- B: camera/controls、brightness/sizeVariance/twinkle/motion、render(背景・DPR・星サイズ・色・halo・星座線見た目)、milkyWay/horizon、projector の上書き値。候補例の「背景の暗さ」「星のサイズ感」「明暗差」「グローの強さ」「色味」「瞬きの強さ」「地平線/風景の主張」はすべてこの内部パラメータ側の実体として対応付けた
- C: 星座線・星座名/星名ラベルは D017 により選択時のみ表示。候補例の「ラベル表示」「星座線表示」はここに該当し、常時表示トグルにする強い理由は今のところない(Task 4 で改めて要否判断)
- D: `SavedSceneState.display` は `mode` / `visualPreset` / `isProjectorMode` のみ保存対象(D020 どおり)

方向性としては、個別スライダー(色味・グロー単体など)は Product Principle 1/5 を壊しやすいため 10次の初手では見送り、プリセット単位の切替を広げる方向が妥当と整理した。この判断は Task 3 で具体的なプリセット候補を決める際の前提として扱う。

完了確認:

- [x] 設定候補一覧が整理されている
- [x] ユーザーに見せるべき項目と内部調整値が分かれている

### Task 3 — 雰囲気プリセットの方向性決定

Status: Done

結果(D029): 表現プリセット(shader 側)は既存の `Planetarium-like` / `Gentle Contrast` の 2 種を維持し、D019 の「最大 2 種」の上限は 10次でも据え置く。「夜間向け表示」は表現プリセットとは別の独立機能 `Night Mode UI` として追加し、対象を UI オーバーレイの配色・明るさのみに限定する(星の描画には触れない)。既存の `applyOverlayAppearance(isProjectorMode)` の CSS 変数差し替えの仕組みを拡張する方向とし、表現プリセットとは独立に併用可能とする。詳細は `docs/features/phase-10-atmosphere-presets.md` の「雰囲気プリセットの方向性決定(Task 3, D029)」を参照。

- 何種類のプリセットを用意するか決める
- 各プリセットの UX intent を決める
- Product Principle 1「Planetarium-like First」を壊さない範囲を決める

候補例:

- Planetarium-like
- Gentle Contrast
- Quiet Night
- Deep Night
- Night Mode UI

完了確認:

- [x] プリセット候補と意図が定義されている
- [x] 方向性が Visual Target から逸脱しない前提が明示されている

### Task 4 — 他アプリにある表示切替機能の振り分け

Status: Done

結果: `docs/features/phase-10-atmosphere-presets.md` に「他アプリにある表示切替機能の振り分け(Task 4)」を追加した。夜間モードは Task 3(D029)で `Night Mode UI` として 10次確定済み。残り 6 候補(星座線表示切替の常時表示化・星座絵表示・ラベル量調整・地平線/グリッド/方位表示・AR/センサー系・イベント/衛星/観測支援)はすべて 13次以降へ回した。判断軸は (1) 既存 Decision(D014・D017・D018)との整合、(2) 10次 Out of Scope(新規データ導入・大規模設定画面)との抵触有無、(3) Product Principle 2/5/7 との相性。いずれも既存の Decision・Out of Scope・Principles をそのまま適用した結果であり、新しい Decision の追加は不要と判断した。

- 他のプラネタリウムアプリで一般的な表示切替機能を整理する
- Veluna で 10次に入れるもの / 13次以降へ回すものを振り分ける
- 「夜間モード」は Task 3(D029)で `Night Mode UI` として 10次に入れることが確定済み。ここでは残りの候補(星座線表示切替・星座絵表示・ラベル量調整・地平線/グリッド/方位表示・AR/センサー系・イベント/衛星/観測支援)を振り分ける

候補元:

- 夜間モード
- 星座線表示切替
- 星座絵表示
- ラベル量調整
- 地平線 / グリッド / 方位表示
- AR / センサー系
- イベント / 衛星 / 観測支援

完了確認:

- [x] 他アプリ系機能の整理表がある
- [x] 10次と 13次以降の責務が分かれている

### Task 5 — 設定 UI の最小構成決定

Status: Done

結果: `docs/features/phase-10-atmosphere-presets.md` に「設定 UI の最小構成決定(Task 5)」を追加した。新しい設定入口/パネルは作らず、`Night Mode UI` は既存の `ProjectorModeToggle` / `ImmersiveModeToggle` と同じ独立トグルボタンのパターンで追加する。表現プリセット(セレクト)と `Night Mode UI`(トグル)は親子関係のない並列コントロールとして扱い、単一設定パネルへの統合は行わない。星座線・ラベル表示切替は Task 4 の確定どおり 10次に含めない。D009・D028・Task 4 の既存判断をそのまま適用した結果であり、新しい Decision の追加は不要と判断した。

- 設定 UI をどこから開くか決める
- プリセット切替と詳細設定の関係を決める
- 星座線やラベルなどの表示切替を 10次に含めるか決める

完了確認:

- [x] UI の最小構成が決まっている
- [x] 星空鑑賞を壊さない前提がある

### Task 6 — 保存対象との接続方針整理

Status: Done

結果: `docs/features/phase-10-atmosphere-presets.md` に「保存対象との接続方針整理(Task 6)」を追加した。10次で保存対象に追加するのは `Night Mode UI` の on/off(`isNightModeUi`)のみ。`isProjectorMode` と同じパターンで `SavedSceneDisplay` に含め、`PERSISTED_SCENE_STATE_VERSION` は 1 のまま追加的(additive)フィールドとして扱う(欠落時は `false` にフォールバックし、既存の version 1 保存データを壊さない)。8次以降の DB 保存(D025 の Sync Contract)とも矛盾しない。一時 UI 状態は引き続き保存対象外(D020 を維持)。

- 10次で増える表示設定のうち、保存対象に入れるものを決める
- 6次の `SavedSceneState` にどう接続するか整理する
- 8次以降の DB 保存とも矛盾しない形にする

完了確認:

- [x] 保存対象へ入れる設定と入れない設定が明確
- [x] 将来の DB 保存と衝突しない方針になっている

### Task 7 — Human Check 観点の定義

Status: Done

結果: `docs/features/phase-10-atmosphere-presets.md` に「Human Check 観点の定義(Task 7)」を追加した。10次の実装対象が `Night Mode UI` のみである前提で、5次(`phase-5-display-experience.md`)の観点を土台に、共通観点(星の見た目に影響しないか・他機能との併用時の破綻有無・chrome の煩雑さ)・PC・スマホ縦画面・プロジェクター利用の 4 区分で整理した。

- 雰囲気プリセットで人間が何を見るべきか整理する
- PC / スマホ / プロジェクター想定の評価観点をまとめる

観点例:

- 落ち着いて見えるか
- プラネタリウムらしさを壊していないか
- 色が派手すぎないか
- グローが強すぎないか
- 設定差分が分かるか
- UI がうるさくないか

完了確認:

- [x] Human Check 観点が定義されている

### Task 8 — 自動検証の方針整理

Status: Done

結果: `docs/features/phase-10-atmosphere-presets.md` に「自動検証の方針整理(Task 8)」を追加した。typecheck / lint / build に加え、`displayState.test.ts` と `sceneState.test.ts` へ `isNightModeUi` の状態遷移・保存互換性テストを追加する方針とし、既存の `e2e/app.spec.ts` を回帰カバレッジとして踏襲する(既存の類似トグルと同様、専用の Playwright spec は新設しない)。見た目・体感依存の観点(配色の刺激度、他機能併用時の破綻有無、chrome の煩雑さ、端末間の一貫性)は Task 7 の Human Check 観点へ委ねる分担とした。

- 10次で追加が必要な unit test / typecheck / browser smoke の範囲を決める
- 見た目依存で自動化しづらい部分を Human Check 前提として明示する

完了確認:

- [x] 自動検証と Human Check の分担が明確

### Task 9 — Night Mode UI の実装

Status: Done

結果: Task 1〜8 の方針どおり `Night Mode UI` を実装した。

- `displayState.ts`: `isNightModeUi` を追加し、`toggleNightModeUi` を `toggleProjectorMode` と同じ形で実装(Task 5)
- `stars/starfieldConfig.ts`: `nightModeUi.overlay` に warm/muted な配色(border/controlBackground/panelBackground/text)を追加
- `overlayStyles.ts`: `applyOverlayAppearance(isProjectorMode, isNightModeUi)` に拡張。両方 ON の場合はプロジェクター補正を優先する仕様とした(投影環境の可読性という、より具体的な制約を優先)。※この「優先(片方の色で上書き)」仕様は、実機確認で「プロジェクター補正を押すと夜間モードが ON/OFF しているように見える」という誤解を招く挙動だったため、後日修正した。詳細は Task 10 の追記を参照
- `NightModeUiToggle.tsx`: `ProjectorModeToggle` と同じ独立トグルボタンとして新規作成し、bottom-left の 3 段目に配置
- `Starfield.tsx`: トグル配線、`applyOverlayAppearance` 呼び出しの引数拡張、シーン保存時の snapshot に `isNightModeUi` を含める配線
- `save/sceneState.ts`: `SavedSceneDisplay.isNightModeUi` を追加。`PERSISTED_SCENE_STATE_VERSION` は 1 のまま、`parseSavedSceneDisplay` で欠落/不正時は `false` にフォールバック(Task 6 の互換性方針どおり)
- テスト: `displayState.test.ts` / `save/sceneState.test.ts` / `save/sceneStorage.test.ts` を更新し、状態遷移・save/restore round-trip・後方互換(`isNightModeUi` 欠落時のフォールバック)のケースを追加

自動検証: typecheck / lint / unit test(182 件)/ production build / Playwright e2e smoke(8 件、PC・モバイル両ビューポート)すべて成功。加えて dev server 上で目視確認(スクリーンショット)し、トグル ON/OFF・プロジェクター補正との併用時の配色切替・星の見た目が変化しないこと・モバイル幅でのレイアウト崩れがないことを確認した。console error なし。

完了確認:

- [x] typecheck / lint / unit test / build が成功
- [x] `isNightModeUi` の状態遷移・保存互換性が unit test で確認されている
- [x] console error なしで起動・トグル操作できる(dev server 上で確認)
- [x] Human Check(Task 7 の観点: 配色の刺激度、プリセット/プロジェクターとの併用、chrome の煩雑さ、PC/スマホ/プロジェクター実機)— 問題なしを確認

### Task 10 — Human Check フィードバックを受けた表示設定の再構成 + プロジェクター投影対策

Status: Done(プロジェクター投影の完全対応は Out of Scope として次回以降へ持ち越し)

結果: Task 9 の Human Check で「表現プリセットの差が分かりにくい」「設定画面としてまとめる想定だった」という指摘を受け、D030・D031(`DECISIONS.md`)として以下を実施した。

- 表現プリセット(`Planetarium-like` / `Gentle Contrast`)を廃止し、`Planetarium-like` 相当の単一ベースラインに固定(D030)
- 独立トグル群(プロジェクター補正・夜間モード)を新規 `SettingsOverlay.tsx` の設定パネルへ統合。鑑賞モードは高頻度操作のため意図的にパネル外へ残置(D030)
- プロジェクターへのミラーリング投影時にブラウザ chrome が投影像を圧迫する問題への対応として、フルスクリーン切替(Fullscreen API)・iOS向け PWA ホーム画面起動・アドレスバー自動収縮の3段構えを追加(D031)

追加修正: 実機確認前の動作確認で「プロジェクター補正を ON/OFF すると夜間モードが ON/OFF しているように見える」という報告を受けた。調査の結果、`isNightModeUi` の状態自体は変わっておらず、両方 ON のとき `applyOverlayAppearance` がプロジェクター補正の色で夜間モードの色を完全に上書きしていたため、そう見えていただけと判明(実際のトグル状態は Playwright で確認済み)。人間の期待は「両方 ON なら両方の効果が乗る」だったため、`starfieldConfig.projectorNightModeUi.overlay` を新設し、夜間モードの暖色をベースにプロジェクター補正の不透明度比率を乗せた専用配色に変更した。typecheck / lint / unit test(186 件)/ build 成功、Playwright での状態遷移確認済み。

完了確認:

- [x] typecheck / lint / unit test(186 件)/ production build が成功
- [x] Human Check(設定パネルの見た目、鑑賞モードとのバランス)— 問題なしを確認
- [x] プロジェクター補正 + 夜間モード併用時、夜間モードの状態表示が上書きされて消えて見える不具合を修正
- [x] プロジェクター投影対策の実機確認(iPhone Safari のホーム画面追加、アドレスバー自動収縮)— 実施済み、問題なし
- [ ] iOS 上の Safari 以外のブラウザ(Chrome for iOS 等)向けの完全な chrome 除去策 — 未解決。`DECISIONS.md` D031 の Known Limitation を参照。次に扱うとしても別タスクとして再度スコープを切ってから着手する

## Notes

- 8次 / 9次 / 12次は後回しとする。理由: 見た目・体験などユーザーの評価に直接つながる部分を先に固め、認証・同期などのシステム面は後回しにする方針のため
- 13次は他アプリにある天文拡張機能、11次は音楽 / リラクゼーション拡張として後続で扱う
- 12次の同期 / 共有は、必要になった時点で再検討する
- プロジェクター投影時のブラウザ chrome 対策(Task 10)は iOS 上の Safari 以外のブラウザで未解決のまま残っている。継続調査は別タスクとして起票してから着手する(`DECISIONS.md` D031 参照)

