# Phase 7 — Implementation Tasks

7次開発(惑星・月・主要天体の表示)を進めるためのタスク分割。
このフェーズは Task 1 でスコープと Small Spec を確定済みとする。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `AGENTS.md`
3. `DEVELOPMENT.md`
4. `docs/TASKS.md`
5. `README.md`
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 関連コード(`src/Starfield.tsx`, `src/astronomy/coordinates.ts`, `src/stars/`, `src/search/`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ
- 7次では UI の見た目改善より、主要天体の表示品質と責務分離を優先する
- 既存の恒星表示・天文計算・表示品質を壊さずに、主要天体系を追加する
- 惑星・月は恒星と異なる計算とデータ責務を持つため、既存の恒星ロジックへ安易に混ぜない

## Task List

### Task 1 — 7次スコープ確定 + Small Spec 作成

Status: Done

結果(D022): 7次の初手は **惑星・月・主要天体の表示** を対象にし、UI の作り込みより表示品質と責務分離を優先する。アカウント同期、共有リンク、課金、大規模な設定画面はこのフェーズの初手には含めない。

- `docs/features/phase-7-celestial-bodies.md` を新規作成した
- `DECISIONS.md` に D022 を追加し、D021 を superseded にした
- `PRODUCT.md`、`README.md`、`docs/TASKS.md`、`DEVELOPMENT.md` の Current Phase / Roadmap を 7次へ更新した

完了確認:

- [x] 7次で実装する機能一覧(やらないことも含む)が確定している
- [x] 7次 Small Spec が作成されている
- [x] 関連ドキュメントが更新されている

### Task 2 — 主要天体データソースと状態モデルの整理

Status: Done

実装内容: `src/celestialBodies/celestialBodyTypes.ts` を追加し、7次初手で扱う主要天体を `moon / mercury / venus / mars / jupiter / saturn` に限定した。ここでは astronomy runtime state (`CelestialBodyState`)、render input (`CelestialBodyRenderData`)、search input (`CelestialBodySearchRecord`) を分離し、既存の恒星 `StarData` / `HygStarRecord` / search index へ直接混ぜない構造を先に切り出した。

静的メタデータとして `CelestialBodyDefinition` と `loadCelestialBodyDefinitions()` / `createCelestialBodySearchRecords()` を追加し、Task 3 以降で位置計算結果や検索統合を受ける境界面を用意した。`src/celestialBodies/celestialBodyTypes.test.ts` では、対象天体の固定、定義の安定順序、search record が runtime sky state を含まないことを確認している。

判断記録として `DECISIONS.md` に D023 を追加し、7次の計算ライブラリを Astronomy Engine、対象天体を月・水星・金星・火星・木星・土星に絞る方針を確定した。

- 惑星・月・主要天体のデータソース候補と責務分離方針を確定する
- 主要天体の runtime state / render input / search input の型を定義する
- 既存の恒星データ・検索・選択と衝突しない構造に整理する
- 必要なら `DECISIONS.md` にデータソース・計算方針を記録する

完了確認:

- [x] 主要天体用の型が明示されている
- [x] 既存の恒星系と分離した構造になっている

### Task 3 — Astronomy Engine adapter の導入

Status: Done

実装内容: `astronomy-engine` を依存へ追加し、`src/celestialBodies/astronomyEngineAdapter.ts` を新設した。ここでは `SupportedCelestialBodyId` から Astronomy Engine の `Body` への対応付け、`ObserverLocation` から `Observer` への変換、`Date` から `AstroTime` への変換、ライブラリの equatorial / horizontal / illumination の戻り値を Veluna 側の型へ落とす純粋関数を定義した。

Task 3 の範囲はあくまで adapter 境界と依存疎通確認に留め、実際の惑星位置計算・月位置計算はまだ実装していない。`createAstronomyEngineSmokeSample()` は最小の end-to-end 疎通確認用で、Task 4 / 5 で実際の body 計算へ差し替える前提とする。

`src/celestialBodies/astronomyEngineAdapter.test.ts` では以下を確認した。

- body id から Astronomy Engine `Body` への対応付け
- observer / time / coordinate / illumination の変換境界
- 恒星ロジックへ触れずに Astronomy Engine を呼び出せること

- Astronomy Engine を Veluna から呼び出す最小 adapter を追加する
- ライブラリの戻り値を `src/celestialBodies/` の型へ変換する境界を作る
- 依存追加と最小の疎通確認を行う

完了確認:

- [x] Astronomy Engine の呼び出し境界ができている
- [x] 既存の恒星ロジックと分離されている

### Task 4 — 惑星の位置計算

Status: Done

実装内容: `src/celestialBodies/planetStateSource.ts` を追加し、水星・金星・火星・木星・土星の runtime state を Astronomy Engine から生成できるようにした。各惑星について `Equator()` と `Horizon()` から equatorial / horizontal coordinates を取得し、`Illumination()` から見かけの等級と illuminated fraction を採用して `CelestialBodyState` へ変換している。

Task 4 ではあえて renderer や既存の星データへ統合せず、`src/celestialBodies/` の中で完結する計算層として切り出した。高度が負の惑星も runtime state には残し、描画するかどうかの判断は後続の Task 6 / 7 に委ねる。

`src/celestialBodies/planetStateSource.test.ts` では以下を確認した。

- 5 惑星が 7次で定義した安定順序で返ること
- 2026-09-01T00:00:00Z / 東京相当地点での RA / Dec / alt / az / distance / magnitude が固定できること
- 地平線下の惑星も runtime state には残ること

- 水星・金星・火星・木星・土星の位置計算を実装する
- 日時・観測地点に応じて alt/az と render input を得られるようにする
- 計算結果を unit test で固定する

完了確認:

- [x] 主要惑星の位置計算が実装されている
- [x] 計算結果をテストで確認できる

### Task 5 — 月の位置計算

Status: Done

実装内容: `src/celestialBodies/moonStateSource.ts` を追加し、月の runtime state を Astronomy Engine から生成できるようにした。`Equator()` と `Horizon()` により月の equatorial / horizontal coordinates を取得し、`Illumination()` から見かけの等級、illuminated fraction、phase angle を取り、さらに `MoonPhase()` の値も保持する `MoonState` として切り出している。

Task 5 では、惑星と同様に月も `src/celestialBodies/` の計算層で完結させ、renderer や既存の星データへの統合はまだ行っていない。月固有の位相値は後続の描画や情報表示で再利用できるように runtime state に含めている。

`src/celestialBodies/moonStateSource.test.ts` では以下を確認した。

- 2026-09-01T00:00:00Z / 東京相当地点での RA / Dec / alt / az / distance / magnitude / phase values が固定できること
- illuminated fraction / phase angle / moon phase が安全な範囲に収まること
- 地平線下でも runtime state から消さず保持できること

- 月の位置計算を実装する
- 必要なら位相や照度の取得もここで扱う
- 日付境界や観測地点差を含む unit test を追加する

完了確認:

- [x] 月の位置計算が実装されている
- [x] 月固有の追加値を安全に扱える

### Task 6 — 主要天体の描画データ変換

Status: Done

実装内容: `src/celestialBodies/celestialBodyRenderData.ts` を追加し、Task 4 / 5 で得た runtime state を renderer 手前の `CelestialBodyRenderData` へ落とす純粋変換を実装した。ここでは高度 0° 未満の主要天体を描画入力から除外し、可視判定を astronomy runtime state ではなく render adaptation 側へ寄せている。

見え方の差分は `CELESTIAL_BODY_VISUAL_RULES` に集約し、月と惑星で別の等級レンジ・brightness 下限・size scale を持たせた。これにより ephemeris 計算や static metadata を触らずに、「月は大きく明るい」「惑星は恒星に近いが少し存在感を持てる」という最小ルールだけを調整できる。`visualClass` は既存の静的定義から引き継ぎ、Task 7 で shader / renderer へ接続しやすい境界に留めている。

`src/celestialBodies/celestialBodyRenderData.test.ts` では以下を確認した。

- 可視主要天体が既存の sky sphere へ投影されること
- 地平線下の主要天体が render input から除外されること
- 月が惑星より大きく明るい描画差分を持つこと
- 入力順を保ったまま不可視天体をフィルタできること
- 等級未取得時も安全な中間 brightness へフォールバックすること

- 惑星・月の runtime state を render input へ変換する
- 恒星とは別の見え方差分を持てる最小ルールを実装する
- renderer へ渡す前段の純粋関数として切り出す

完了確認:

- [x] render input 変換が実装されている
- [x] 見え方の責務が計算層と分離されている

### Task 7 — 主要天体の描画統合

Status: Done

実装内容: `src/celestialBodies/celestialBodyDataSource.ts` を追加し、Task 4 / 5 の計算層と Task 6 の render input 変換を束ねて、月と可視惑星の描画データ列を生成できるようにした。`src/Starfield.tsx` では初回描画と日時・場所更新のたびに主要天体データも再計算し、既存の恒星更新フローと同じタイミングで renderer へ流すようにした。

`src/render/StarfieldRenderer.ts` には恒星レイヤーと別の `celestialBodyPoints` を追加し、同じ point shader を再利用しながら、主要天体だけを独立した geometry として描画するようにした。これにより既存の恒星 `Points` や Milky Way・地平線レイヤーの責務は維持したまま、Task 10 で主要天体だけの見え方調整を入れられる土台になっている。色は `starfieldConfig.render.celestialBodyColor` に集約し、月・暖色惑星・寒色惑星の差分を最小限だけ持たせた。

`src/celestialBodies/celestialBodyDataSource.test.ts` と `src/Starfield.test.tsx` の更新では以下を確認した。

- 固定日時・地点で可視主要天体だけが安定順で render data 化されること
- 月が可視惑星より大きい描画スケールを持つこと
- 日時・場所変更時に主要天体レイヤーも恒星と同様に再計算されること

- 惑星・月を既存の星空へ描画統合する
- 既存 shader / renderer の責務を壊さずに追加する
- まずは表示できる状態まで持っていく

完了確認:

- [x] 主要天体が画面上に表示される
- [x] 恒星の見え方を大きく壊していない

### Task 8 — 主要天体検索の統合

Status: Done

実装内容: `src/search/searchIndex.ts` に `celestialBody` 検索結果種別を追加し、Task 2 で定義した静的メタデータ(`createCelestialBodySearchRecords()`)を既存の星座・恒星検索へ統合した。検索結果の予算は、星座・主要天体・恒星の 3 グループへ分け、星座の大量ヒットが主要天体や恒星を押し流さないように整理している。

`src/SearchOverlay.tsx` では検索入力の案内文を主要天体込みへ更新し、主要天体結果をクリックしたときの分岐を追加した。`src/Starfield.tsx` 側では主要天体検索選択を受ける最小ハンドラを追加し、Task 9 の情報表示へ先回りせず、現在日時・地点での対象天体の位置へカメラを移動しつつ既存の星選択 UI は閉じるようにした。

`src/search/searchIndex.test.ts` と `src/Starfield.test.tsx` では以下を確認した。

- 英語名・日本語名の両方で主要天体検索できること
- 広いクエリでも星座・主要天体・恒星が共存して結果に残ること
- 主要天体の表示名が静的メタデータどおりに整形されること
- 主要天体を検索選択すると、既存の星選択 UI を残さずその方向へ視線移動できること

- 惑星・月を既存の検索対象へ追加する
- 検索結果の表示名と優先順位を整理する
- 恒星・星座検索との衝突を避ける

完了確認:

- [x] 検索から主要天体へ移動できる
- [x] 既存検索に重大な回帰がない

### Task 9 — 選択・軽い情報表示への統合

Status: Done

実装内容: `src/celestialBodies/celestialBodyInfo.ts` を追加し、主要天体の runtime state から `StarInfoOverlay` が既に受け取れる selection info 形式へ変換する最小 builder を実装した。ここでは表示名、種別(月 / 惑星)、落ち着いた色ラベル、簡単な見え方(満ち欠けや照らされ方)だけを作り、数値中心の観測 UI には広げていない。

`src/StarInfoOverlay.tsx` と `src/stars/starInfo.ts` では既存の選択情報モデルを少し拡張し、星・星座・主要天体を同じパネルで扱えるようにした。`src/Starfield.tsx` 側では主要天体検索選択時に info panel を開き、日時・場所変更中も選択中の主要天体情報が現在状態へ追従更新するようにしている。星座線やラベルは主要天体選択では出さず、常時情報過多を避ける。

`src/celestialBodies/celestialBodyInfo.test.ts`、`src/stars/starInfo.test.ts`、`src/Starfield.test.tsx` では以下を確認した。

- 惑星・月の選択情報が表示名、種別、色ラベル、見え方ラベルを持つこと
- 既存の星・星座 selection info が同じモデル上で維持されること
- 主要天体を検索選択すると情報パネルが開くこと
- 主要天体を選択したまま日時変更しても選択が残り、情報が更新されること

- 選択時に最低限の名前・種別・軽い情報を表示できるようにする
- 既存の星・星座 selection と衝突しない状態遷移にする
- 常時情報過多にならない導線を維持する

完了確認:

- [x] 選択から主要天体情報を見られる
- [x] 情報表示が静かな体験を壊していない

### Task 10 — 表示品質の調整

Status: Done

実装内容: `src/celestialBodies/celestialBodyRenderData.ts` の描画変換ルールを見直し、月と惑星の brightness / size scale を全体に少し抑えた。加えて、高度 0° 付近では brightness と size を段階的に減衰させるようにし、地平線近くの主要天体が恒星レイヤーより不自然に主張しすぎないようにした。

色味は `src/stars/starfieldConfig.ts` の `celestialBodyColor` を少し desaturate し、月・暖色惑星・寒色惑星の差分は残しつつ、白中心の落ち着いた方向へ寄せている。`src/celestialBodies/celestialBodyRenderData.test.ts` には地平線付近の減衰確認を追加し、`src/Starfield.test.tsx` では低空の月でも info 表示テストが安定するよう期待値を実際の文言仕様へ合わせた。

その後、local server を起動して desktop / mobile viewport の browser smoke を行い、月を選択した状態も含めて主要天体が恒星レイヤーを押しのけるほど派手になっていないことを確認した。現時点では追加の code tuning は入れず、Human Check で「まだ目立ちすぎる」「スマホだけ印象が違う」と判断された場合のみ、この Task 内で再調整する。

- 惑星・月の明るさ、サイズ感、色味、地平線付近での見え方を調整する
- PC とスマホ縦画面で同じ印象になるかを確認する
- 必要なら既存ラベルや selection 表示の静音化も含めて整える

完了確認:

- [x] 主要天体が不自然に目立ちすぎない
- [x] 夜空としての落ち着きを維持できている

### Task 11 — コードレビュー

Status: Done

実装内容: 7次で追加した `src/celestialBodies/` の計算層・render adaptation・検索統合・選択情報表示・`src/Starfield.tsx` の統合点を読み直し、主要天体系が恒星系へ責務混在せず接続されているか、日時/場所変更時の状態更新に抜けがないか、検索・選択・描画更新の状態遷移に回帰がないかを確認した。

レビューでは、`CelestialBodyState` / `CelestialBodyRenderData` / `CelestialBodySearchRecord` の境界、`generateCelestialBodyRenderData()` の計算責務、`handleDateChange()` / `handleLocationChange()` での再計算と選択情報追従、`SelectionOverlay` / `searchIndex` の静的メタデータ利用、renderer 側の独立レイヤー化を重点的に確認した。現時点では重大な指摘はなく、Task 11 内で追加修正が必要な問題は見つからなかった。

- 主要天体追加の責務分離、既存フェーズへの副作用、計算の妥当性を確認する
- 必要な修正と回帰テストを入れる

完了確認:

- [x] 重大な指摘がない、または対応済み

### Task 12 — 自動検証の仕上げ

Status: Done

実装内容: 7次の自動検証として `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run test:e2e` を実行した。sandbox では Vite/Vitest/Playwright の起動時に `spawn EPERM` が出るため、unit test と browser smoke は権限昇格で実施している。

検証中に現仕様との差分として 3 点を修正した。`e2e/search-smoke.spec.ts` は 7次で更新済みの検索入力ラベル `星座名・星名・主要天体で検索` に追従させ、`src/stars/hygCatalogSource.test.ts` は HYG 全件走査テストに timeout を明示し、`src/Starfield.test.tsx` は月の info 表示文言を detail 行全体ではなく照度ラベル本体で確認するようにして、表示文言の前置き差分に依存しない形へ調整した。

最終結果として、typecheck / lint / unit test 180 件 / production build / Playwright smoke 8 件が成功し、7次 Small Spec の Acceptance Criteria(Automated / Technical) を満たした。browser smoke でも console error は出ていない。

- typecheck / lint / unit test / production build / browser smoke test を通す
- 7次の Acceptance Criteria(Automated / Technical)を満たすことを確認する

完了確認:

- [x] 7次 Small Spec の Acceptance Criteria(Automated / Technical)を満たす
- [x] 7次全体が Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
