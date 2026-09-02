# Phase 10 — Atmosphere Presets And Display Settings

## Status

Task 1〜9 完了(実装当時点)。**2026-09: Task 9 の Human Check を受け、表現プリセットは廃止、設定 UI は最小パネル(`SettingsOverlay`)へ統合した。詳細は `DECISIONS.md` D030 を参照。**

## Goal

雰囲気の異なる夜空体験を、静けさを保ったまま切り替えて楽しめる基盤を整える。

1次〜7次で、実際の星空を静かに眺め、時間を流し、興味を持った星や星座・主要天体を知り、表示状態を保存して再開できるところまで整えた。5次では鑑賞モード・UI自動非表示・軽い表現プリセット(`Planetarium-like` / `Gentle Contrast`)・プロジェクター向け表示補正を確立している。10次ではその土台の上に、落ち着いた鑑賞向け・少しコントラストを立てた見え方・夜間向け表示など、**雰囲気の違う夜空体験** を切り替えられる幅を整理する。

## Background / Reference

- `PRODUCT.md` — Product Vision、Product Principle 1/2/5、Current Phase: 10次開発
- `DEVELOPMENT.md` — Phase Roadmap: 10次
- `DECISIONS.md` — D004(表現設定の一元管理)、D009(オーバーレイ方向)、D011(プラネタリウム基準)、D017(選択時のみ表示)、D019(5次表現プリセット方針・最大2種)、D020(保存対象方針)、D028(10次スコープ確定)
- `docs/features/phase-5-display-experience.md` — 5次 Small Spec(Done)。鑑賞モード・UI自動非表示・表現プリセット・プロジェクター補正はここで確立済み
- `docs/features/phase-10-implementation-tasks.md` — 10次のタスク分割・Notes(8次/9次/12次を後回しにする理由)
- 既存コード: `src/displayState.ts`, `src/stars/starfieldConfig.ts`, `src/VisualPresetOverlay.tsx`, `src/ImmersiveModeToggle.tsx`, `src/ProjectorModeToggle.tsx`, `src/render/StarfieldRenderer.ts`

## Scope(Task 1 で確定 — D028)

- **雰囲気プリセットの方向性整理**: 既存の `Planetarium-like` / `Gentle Contrast` の位置付けを整理し、夜間向け表示などの追加候補を検討する(具体的な種類・数は Task 3 で決める)
- **設定可能な表示項目の棚卸し**: 内部パラメータとユーザー向け設定候補を分ける(Task 2)
- **他アプリにある表示切替系機能の振り分け**: 10次でやるもの / 13次以降へ回すものを分ける(Task 4)
- **最小の設定 UI 方針の決定**: どこから開くか、プリセット切替と詳細設定の関係(Task 5)
- **保存対象との接続整理**: 10次で増える表示設定のうち `SavedSceneState` に含めるものを決める(Task 6)

10次でも巨大な設定画面は優先しない。既存の静かな表示体験を維持したまま、雰囲気の選択肢を軽く広げる範囲に留める。

## Out of Scope(10次では作らない)

- アカウント・同期・課金(8次 / 9次 / 12次)。理由: 見た目・体験などユーザーの評価に直接つながる部分を先に固め、認証・同期などのシステム面は後回しにする方針のため(`docs/features/phase-10-implementation-tasks.md` Notes)
- 新しい星・星座・天体データソースの導入
- 惑星・月の新規機能拡張(既存の表示をそのまま利用する)
- BGM・環境音・スリープタイマー(11次)
- AR・センサー系、観測支援、イベント・衛星情報(13次)
- 大規模な設定画面の新規設計

上記は「不要」ではなく、10次の初手では扱わない。

## Technical Direction

- 表現プリセット・表示設定は引き続き `src/stars/starfieldConfig.ts` / `src/displayState.ts` へ集約する(D004)。新しい設定値を散らばらせない
- 新しいプリセットを追加する場合も、既存の `StarfieldVisualPreset` の shape を拡張する範囲に留め、新しい描画パスやシェーダーの再設計は行わない
- 「夜間向け表示」候補は、恒星の見た目(shader)側の調整なのか、UI chrome(オーバーレイの配色・明るさ)側の調整なのかを Task 3 で切り分ける
- 保存対象への追加は、6次で定義した `PersistedSceneStateV1` の互換性を壊さない形で拡張する(D020)
- 既存の星の位置計算・カメラ/再生エンジン・主要天体系には手を入れない

## 設定可能項目の棚卸し(Task 2)

既存実装(`src/stars/starfieldConfig.ts` / `src/displayState.ts` / `src/save/sceneState.ts` / 各 `*Overlay.tsx` / `*Toggle.tsx`)を対象に、調整可能な項目を棚卸しした。

### A. 既にユーザー向け UI がある項目

| 項目 | 現在の UI | 状態の置き場所 |
|---|---|---|
| 表現プリセット切替(`Planetarium-like` / `Gentle Contrast`) | `VisualPresetOverlay.tsx`(セレクト) | `displayState.visualPreset` |
| 鑑賞モード(主要 UI を退避) | `ImmersiveModeToggle.tsx` | `displayState.mode` |
| プロジェクター向け表示補正 | `ProjectorModeToggle.tsx` | `displayState.isProjectorMode` |
| UI 自動非表示(標準モード中、無操作で chrome を隠す) | 自動(明示的な UI トグルなし) | `displayState.chromeVisibility` |

これら 4 つは 5次で確立済みで、10次はこの上に選択肢を広げる。

### B. 内部パラメータ(現状ユーザー設定なし、`starfieldConfig.ts` に集約済み)

| カテゴリ | 項目 | 備考 |
|---|---|---|
| camera / controls | FOV, drag 感度, pitch 制限, zoom 範囲, tap 判定 | 操作系のチューニング値。表現の雰囲気とは別軸 |
| brightness / sizeVariance | 明るさ・サイズの分布範囲 | 星カタログの正規化に使う内部値 |
| twinkle | `minAmplitude` / `maxAmplitude` / `speed` 等 | 「瞬きの強さ」の実体。現状は固定値のみ |
| motion | drift 振幅・速度、`reducedMotionScale` | 「動きの控えめさ」の実体。`prefers-reduced-motion` 時は自動減衰(既存) |
| render.background / dprCap / pointSizePixels | 背景色, DPR cap, 星サイズ(px) | 「背景の暗さ」「星のサイズ感」の実体。現状はプリセット経由でのみ間接的に変わる |
| render.colorCategoryColor / celestialBodyColor | 星・天体の色 | 「色味」の実体。ユーザー調整項目としては未検討(Product Principle 1 の「白中心・控えめな色差」を壊すリスクが高い) |
| render.halo | 閾値・power・半径倍率・intensity | 「グローの強さ」の実体。プリセット間で軽く差はあるが個別スライダーはない |
| render.constellationLines | 色・opacity | 星座線そのものの表示可否ではなく、選択時に出す線の見た目 |
| milkyWay / horizon | 密度・opacity・色・角度範囲 | 「地平線 / 風景の主張」の実体。プリセット・プロジェクター補正から間接的に倍率がかかる |
| projector.render / projector.overlay | プロジェクター時の上書き値一式 | プロジェクターモード ON 時のみ適用。個別調整 UI はない |

### C. UI 表示可否(表現パラメータではなく表示/非表示の切替)

| 項目 | 現状 | 備考 |
|---|---|---|
| 星座線表示 | 選択時のみ表示(D017)。常時表示トグルはない | 「星座線表示」候補は、常時表示化ではなく現行仕様の維持が前提。変更するなら Product Principle 5 に関わるため人間確認が必要 |
| 星座名・星名ラベル | `ConstellationLabelsOverlay.tsx` / `StarInfoOverlay.tsx`。選択時のみ表示 | 同上。「ラベル量調整」を今後扱うなら、常時表示ではなく選択時表示の密度調整として検討する余地がある |

### D. `SavedSceneState` に含まれる項目(6次, D020)

`display.mode` / `display.visualPreset` / `display.isProjectorMode` のみが保存対象(`src/save/sceneState.ts`)。`chromeVisibility` や選択中のパネルなど一時 UI 状態は対象外(D020 の方針どおり)。10次で表示設定が増えた場合の接続方針は Task 6 で扱う。

### まとめ — ユーザー向け設定候補と内部パラメータの分離

- **ユーザーに見せる価値がありそうな候補**: 雰囲気プリセットの選択肢を増やす(既存の A を拡張)。個別スライダー(色味・グローの強さ単体など)は Product Principle 1/5 を壊しやすいため、10次の初手では見送り、プリセット単位の切替に留める方向が妥当
- **内部パラメータのまま維持すべきもの**: camera/controls、brightness/sizeVariance/twinkle/motion の生値、color 系。Human Check でのチューニング用途が主目的で、ユーザー向け UI にする必要性が薄い
- **表示可否(B ではなく C)**: 星座線・ラベルは D017 の「選択時のみ表示」が既に Calm by Default を満たしており、10次で常時表示トグルを追加する強い理由はない。Task 4(他アプリ機能の振り分け)で改めて要否を判断する

## 雰囲気プリセットの方向性決定(Task 3, D029)

人間確認のうえ、以下で確定した。

- **表現プリセット(shader 側, `StarfieldVisualPreset`)は既存の `Planetarium-like` / `Gentle Contrast` の 2 種を維持する。** D019 の「最大 2 種」の上限はそのまま据え置き、10次では新規追加しない
- **「夜間向け表示」は表現プリセットとは別の独立機能 `Night Mode UI` として 10次に追加する。** 対象は星の描画(shader)ではなく、UI オーバーレイ(ボタン・パネルの配色・明るさ)のみ。既存の `applyOverlayAppearance(isProjectorMode)` / `overlayStyles.ts` の CSS 変数差し替えの仕組みを拡張し、プロジェクターモードと同様の方法で実現する方向とする(新しい描画パスは作らない)
- 表現プリセットと `Night Mode UI` は独立した軸として扱い、併用可能とする(例: `Gentle Contrast` + `Night Mode UI`)

### 各項目の UX intent

| 項目 | 種別 | UX intent |
|---|---|---|
| `Planetarium-like` | 表現プリセット(shader) | D011 のプラネタリウム基準に忠実な標準表現 |
| `Gentle Contrast` | 表現プリセット(shader) | 明暗差をわずかに強めた鑑賞向け(既存) |
| `Night Mode UI` | UI chrome のみ | 就寝直前などの利用時、UI オーバーレイの明るさ・コントラストを抑え、白っぽい UI が夜間の暗順応や星空の没入感を妨げないようにする。星の見た目(shader)は変更しない |

`Night Mode UI` は、A区分の「UI 自動非表示(無操作で隠す)」とは別の仕組みとして扱う。自動非表示は「表示するかどうか」、`Night Mode UI` は「表示中の配色をどう抑えるか」であり、役割が異なるため統合しない。

### Product Principle 1 を壊さない範囲

- `Night Mode UI` は星のレンダリング(shader・`starVisualAttributes`)に一切触れないため、星のサイズ・色・グロー・階層など Principle 1 の基準に影響しない
- 表現プリセットは 2 種のまま据え置くため、D019 で確立した「軽い差分に留める」ガードレールをそのまま維持する
- 具体的な配色値・UI 適用範囲(どのオーバーレイに適用するか)は Task 5(設定 UI の最小構成)で詰める

## 他アプリにある表示切替機能の振り分け(Task 4)

他のプラネタリウム/星空アプリで一般的な表示切替系機能のうち、`docs/features/phase-10-implementation-tasks.md` Task 4 に挙げた候補(夜間モードを除く)を、既存の Decision と Product Principles に照らして振り分けた。

| 候補 | 種別 | 振り分け | 理由 |
|---|---|---|---|
| 夜間モード | UI chrome のみ | **10次(確定済み)** | Task 3(D029)で `Night Mode UI` として 10次スコープに確定済み。本 Task の対象は残り 6 候補 |
| 星座線表示切替(常時表示化) | 表示可否切替 | 13次以降 | D017 で「選択時のみ表示」を Calm by Default(Principle 5)のガードレールとして確定済み。常時表示化は見た目・UX が大きく変わる変更であり、変更するなら人間確認が必要(Task 2 でも同様に整理済み)。10次では現状維持とし、変更の必要性が具体的に出た時点で改めて Small Spec を起こす |
| 星座絵表示(星座の絵柄オーバーレイ) | 新規ビジュアル要素 | 13次以降 | 実現には新しい画像アセットの導入が必要になり、10次 Out of Scope の「新しい星・星座・天体データソースの導入」に抵触する。商用利用条件の確認(Principle 7)も別途必要 |
| ラベル量調整 | 表示密度調整 | 13次以降 | 雰囲気(見た目のトーン)の切替ではなく情報量の調整であり、10次の雰囲気プリセットのスコープ外。Task 2 で「選択時表示の密度調整として検討余地あり」と整理済みだが、独立した機能としてスコープを確定してから着手すべき |
| 地平線 / グリッド / 方位表示 | 観測支援表示 | 13次以降 | グリッド線・方位表示は観測ツール的な性格が強く、Principle 2(Relaxation Over Information Density)と相性が悪い。既存の地平線/風景(4次, D018)は雰囲気表現としてそのまま維持し、グリッド/方位表示は新規に追加しない |
| AR / センサー系 | 入力方式 | 13次以降 | D014 で 2次の視点操作をドラッグ操作のみと確定済み(ジャイロ入力は対象外)。0次 Out of Scope にも AR/端末方向追従が明記されており、方針変更の必要性は確認されていない |
| イベント / 衛星 / 観測支援 | 観測支援機能 | 13次以降 | 癒し用途(Principle 2)よりも観測支援ドメインの機能であり、新規データソース導入が前提になる可能性が高い。3次(星座知識)・7次(主要天体)の「軽い情報」の範囲を超える |

### まとめ

- 10次に追加するのは Task 3(D029)で確定済みの `Night Mode UI` のみ。残り 6 候補はすべて 13次以降(「他アプリにある天文拡張機能」)へ回す
- 振り分けの判断軸は、(1) 既存 Decision(D014, D017, D018)との整合、(2) 10次 Out of Scope(新規データ導入・大規模設定画面)との抵触有無、(3) Product Principle 2/5/7 との相性、の 3 点
- 新しい Decision の追加は不要と判断した。いずれも既存の Decision・Out of Scope・Product Principles をそのまま適用した結果であり、新たな不可逆判断を伴わない

## 設定 UI の最小構成決定(Task 5)

既存実装(`src/Starfield.tsx` / `src/displayState.ts`)を確認したうえで、以下で確定した。人間確認は不要と判断した — いずれも D009(オーバーレイ方向)・D028(巨大な設定画面は作らない)・Task 4 の振り分け結果をそのまま適用した帰結であり、見た目/UX が大きく変わる複数案の選択にはあたらないため。

- **新しい「設定」入口・パネルは作らない。** `Night Mode UI` は、既存の `ProjectorModeToggle` / `ImmersiveModeToggle` と同じパターン(chrome 上に並ぶ独立した on/off トグルボタン、状態は `displayState` に集約)で実装する。Date/Location/Search のような開閉式パネルは、詳細設定を持たない単純な on/off には不要
- **プリセット切替と詳細設定の関係:** 10次では「詳細設定」の実体を追加しない(個別スライダー等は Task 2・Task 4 で見送り済み)。`VisualPresetOverlay`(表現プリセットのセレクト)と `Night Mode UI` トグルは、親子関係を持たない独立した並列コントロールとして扱う。単一の設定パネルへの統合は今回行わない
- **星座線・ラベルなどの表示切替は 10次に含めない。** Task 4 で 13次以降へ確定済みのため、UI 構成にも追加しない
- 配置(画面上の位置・アイコン・ラベル文言)は実装時の軽微な実装詳細として、Task 7 の Human Check(UI がうるさくないか)で調整する

### 設定項目が増えた場合の将来方針

トグル/セレクトが乱立して chrome が煩雑に見え始めた場合は、その時点で D009 の「オーバーレイ方向」に基づくまとめた設定パネル(ボトムシート/サイドパネル)を改めて検討する。10次時点ではその必要性を判断する材料(実装後の Human Check)がないため、先回りして設計しない。

## 保存対象との接続方針整理(Task 6)

既存実装(`src/save/sceneState.ts` の `SavedSceneState` / `SavedSceneDisplay` / `PersistedSceneStateV1`)を確認したうえで、以下で確定した。

- **10次で保存対象に追加するのは `Night Mode UI` の on/off のみ。** 他の 10次候補は Task 4 で 13次以降へ確定済みのため対象外
- **接続方法:** `displayState.isNightModeUi: boolean` を追加し、`isProjectorMode` と全く同じパターンで `SavedSceneDisplay` / `SavedSceneState.display` に含める。`Night Mode UI` は「星空を再現するための状態」というより UI chrome の配色設定だが、D020 が既に `isProjectorMode`(同じく UI/表示の補正設定)を保存対象に含めており、同種の「環境・利用シーンに応じた表示設定」として扱うのが一貫している。開いているパネルや選択中の星のような一時 UI 状態(D020 の対象外)とは性質が異なる
- **スキーマ互換性:** `PERSISTED_SCENE_STATE_VERSION` は 1 のまま据え置く。`isNightModeUi` は既存データに存在しないフィールドのため、`parseSavedSceneDisplay` で値が欠落/不正な場合は `false` にフォールバックする追加的(additive)なフィールドとして扱い、既存の version 1 保存データを壊さない。version を上げて破壊的に扱う必要はない
- **8次以降の DB 保存との整合:** D025(archived)時点の Sync Contract は `scene_payload` を `SavedSceneState` 相当の JSON としてそのまま同期する想定だったため、`display.isNightModeUi` を追加してもクラウド側スキーマと矛盾しない。将来 Better Auth 前提で 8次を再実装する際も、ローカル保存と同じ「欠落時はデフォルト値」の方針を踏襲すればよい
- **保存対象に含めないもの:** 一時 UI 状態(開いているパネル、`chromeVisibility`、選択中の星/説明パネルなど)は引き続き対象外(D020 を維持)

## Human Check 観点の定義(Task 7)

10次で実装対象になるのは `Night Mode UI`(Task 3, D029)のみ(既存 2 表現プリセットは変更しない)。5次(`phase-5-display-experience.md`)の Human Check 観点を土台に、`Night Mode UI` 固有の観点を追加した。

### 共通観点(全端末)

- `Night Mode UI` を ON にしたとき、UI オーバーレイの明るさ・コントラストが抑えられ、就寝前の利用で刺激的に見えないか
- `Night Mode UI` は星の見た目(shader・`starVisualAttributes`)に一切影響していないか(D029 の前提どおり、星のサイズ・色・グロー・階層が ON/OFF で変わらないこと)
- ON/OFF の差分が体感できるが、過剰な演出になっていないか(暗すぎて UI が読めない、コントラストが強すぎて逆に目立つ、等がないか)
- 表現プリセット(`Planetarium-like` / `Gentle Contrast`)・プロジェクターモードと併用したときに、配色が衝突したり破綻したりしないか(3 機能はすべて独立軸だが、CSS 変数の重ね掛けで意図しない見た目にならないか)
- `Night Mode UI` トグルが増えたことで、chrome 全体が煩雑に見えないか(Product Principle 5, Calm by Default)

### PC

- トグルの位置・見た目が既存の `ProjectorModeToggle` / `ImmersiveModeToggle` と統一感があるか

### スマホ縦画面

- トグルが増えても、既存のオーバーレイ群(表現プリセット・プロジェクター・鑑賞モード等)の間隔やタップ領域が窮屈にならないか

### プロジェクター利用

- `Night Mode UI` とプロジェクター向け表示補正を併用したとき、暗部つぶれや UI 可読性の悪化が起きないか(両者とも overlay 配色を調整する機能のため、重ね掛けの影響を重点確認する)

## 自動検証の方針整理(Task 8)

既存のテスト構成(`src/displayState.test.ts`, `src/save/sceneState.test.ts`, `e2e/app.spec.ts` ほかの smoke spec)を確認したうえで、`Night Mode UI` 実装時の自動検証範囲を以下のとおり整理した。

### 自動化する範囲

- **typecheck**: `isNightModeUi` を含む型定義(`DisplayState`, `SavedSceneDisplay` 等)の整合性
- **lint**: 既存ルールをそのまま適用
- **unit test**:
  - `src/displayState.test.ts` に `Night Mode UI` の状態遷移(toggle 関数の on/off、他の状態フィールドを壊さないこと)を追加。既存の `toggleProjectorMode` のテストと同じ形で書ける
  - `src/save/sceneState.test.ts` に、`isNightModeUi` を含むシーンの save/restore round-trip と、既存(`isNightModeUi` を持たない旧 version 1 データ)を読み込んだ際に `false` へフォールバックすることの回帰テストを追加(Task 6 のスキーマ互換性方針の検証)
- **production build**: `vite build` が成功する
- **browser smoke**: 既存の `e2e/app.spec.ts`(console error なしでロードできること)がそのまま回帰カバレッジになる。`ProjectorModeToggle` / `VisualPresetOverlay` など既存の類似トグルにも専用の e2e smoke spec は無く、状態遷移は unit test 側で担保する方針を踏襲するため、`Night Mode UI` 専用の Playwright spec は新設しない

### Human Check 前提とする範囲(自動化しない)

Task 7 で定義した観点はいずれも見た目・体感に依存するため自動化しない。

- 配色が「就寝前に刺激的でない」と感じられるか
- 表現プリセット・プロジェクターモードとの併用時に配色が破綻していないか
- chrome 全体が煩雑に見えないか(トグル増加の影響)
- PC・スマホ縦画面・プロジェクター利用での一貫した印象

### 分担のまとめ

| 検証内容 | 手段 |
|---|---|
| 型・構文・ビルドが壊れていないか | typecheck / lint / build(自動) |
| 状態遷移・保存データの互換性が壊れていないか | unit test(自動) |
| ページロード時に例外が出ないか | 既存 e2e smoke(自動) |
| 見た目・雰囲気が意図通りか | Human Check(手動、Task 7 の観点) |

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- 追加した表示設定の状態遷移を unit test で確認する
- console error なし

### Human Check

- 追加した雰囲気プリセットがプラネタリウム基準(D011)から外れていない
- 色が派手すぎない、グローが強すぎない
- プリセット間の差分が体感できる
- PC・スマホ縦画面・プロジェクター利用を想定して破綻しない
- UI がうるさくなっていない

## Questions Claude May Ask

Task 1 で以下は人間確認のうえ確定済み(D028)。

- ~~10次の初手は何か~~ → 雰囲気プリセットの方向性整理 + 設定棚卸し + 他アプリ機能の振り分け + 最小 UI 方針 + 保存対象整理
- ~~巨大な設定画面を作るか~~ → 作らない
- ~~8次 / 9次 / 12次を先に片付けるか~~ → 後回し(見た目・体験を優先する方針)

以降のタスク(プリセットの具体的な種類・数、他アプリ機能の振り分け表、UI 最小構成)は Task 2 以降で人間確認しながら進める。小さな実装詳細では質問せず、合理的に判断して進める。
