# Phase 2 — Implementation Tasks

2次開発(`docs/features/phase-2-playback.md`)を実装するためのタスク分割。
セッションをまたいで進めるための作業単位であり、Feature Spec 自体の代わりにはならない。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `CLAUDE.md`
3. `DEVELOPMENT.md`
4. `docs/features/phase-2-playback.md`
5. `docs/features/phase-1-real-sky.md`(1次の前提、Done)
6. `docs/features/phase-0-starfield.md`(0次の前提、Done)
7. `DECISIONS.md`
8. このファイル(現在の進捗確認)
9. 既存コード(`src/stars/`, `src/astronomy/`, `src/render/`, `src/Starfield.tsx`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ(自動で連続実行しない)。
- Out of Scope(`phase-2-playback.md` 参照)には手を出さない。
- 星の「見た目」(shader・starVisualAttributes・config)は 0次/1次の資産をそのまま使う。位置計算・カメラ・再生制御の追加に専念する。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り質問せず合理的に進めてよい。仮定は完了報告に書く。
- Task 1(技術方針の確定)は見た目/UX に大きく影響するため、必ず人間確認のうえで先へ進む。

## Task List

### Task 1 — 技術方針の確定(球面表示・視点操作・カメラ)

Status: Done(決定内容は `DECISIONS.md` D014 を参照)

- 球面表示を 1次の平面表示から完全に置き換えるか、切替可能な形で共存させるかを整理し、人間へ提案する
- 視点移動の入力方式(ドラッグ、ジャイロセンサー、ボタン操作等)を整理し、人間へ提案する
- 現行の `THREE.OrthographicCamera` のままで球面表示・視点移動・ズームを実現できるか、`PerspectiveCamera` への変更が必要かを調査する
- 決定事項を `DECISIONS.md` へ記録する

完了確認:
- 球面表示の方針(置換 or 切替共存)が決定し、`DECISIONS.md` に記録されている
- カメラ方式(Orthographic 維持 or Perspective 変更)の技術判断が完了している
- 視点移動の入力方式が決定している

### Task 2 — 星の球面配置(placement 層の拡張)

Status: Done

- Task 1 の決定に基づき、alt/az を 3D 球面座標へ変換する層を新設する(`src/stars/skyProjection.ts` は平面専用のため、置き換えるか並存させるかは Task 1 の決定に従う)
- 0次/1次で確立した見た目レイヤー(shader・`starVisualAttributes.ts`)や星データ・天文計算(`src/astronomy/coordinates.ts`)は変更しない(D003)
- レンダラー側のカメラを Task 1 の決定に合わせて更新する

完了確認:
- unit test で球面座標変換の妥当性を確認する(既知の星が球面上で正しい方向・高度に配置される)
- ブラウザで球面表示の星空が破綻なく表示される

### Task 3 — 視点移動・ズーム

Status: Done

- Task 1 で決定した入力方式でカメラ操作(視点移動)を実装する
- ズーム(FOV またはカメラ距離操作)を実装する
- 過度な操作でプラネタリウム的な落ち着きを壊さないよう、操作範囲・感度を調整する

完了確認:
- PC・スマホ双方で視点移動・ズームが直感的に動作する
- Human Check(操作が没入感を壊していないか)

Human Check メモ(Task 4 実装後、再生機能を試した際のフィードバック):
再生中、地平線などの固定基準がないため「星が動いている」のか「画面(カメラ)がパンしている」のか視覚的に区別できず、パンしているように感じて好みではないとの指摘あり。技術的にはカメラは再生に連動して動いておらず(星の位置のみ再計算)、D014(地平線なしの球面表示)から来る本質的な見え方の性質。対応方針(方位目印の追加/常時drift演出の停止/速度側での緩和など)は一旦保留とし、人間の判断待ち。Task 6(オーバーレイUI整理)着手時に再検討する。

### Task 4 — 再生エンジン(再生／停止／速度／巻き戻し)

Status: Done

- `date` を一定間隔で連続的に進める/戻す playback エンジンを実装する(既存の `Starfield.handleDateChange` → `generateRealStarData` → `StarfieldRenderer.updateStars` の経路を流用)
- 再生／停止、速度プリセット選択、巻き戻し方向切替の最小 UI を追加する

完了確認:
- 再生を開始すると星が時間経過に応じて動く
- 速度を変えると動きの速さが変わる
- 巻き戻しで星が逆方向に正しく動く
- 停止で動きが止まる

### Task 5 — 再生時のパフォーマンス対応

Status: Done

- Playwright + Chrome DevTools Protocol の CPU throttling(`Emulation.setCPUThrottlingRate`)で desktop Chrome 上に mid/low-tier mobile 相当の負荷を再現し、再生中のフレーム時間・Long Task を計測(実機は未使用。一時的な計測スクリプトはコミットしていない)
  - 変更前: 4x throttle で平均 47.8ms/frame(約21fps)、33.3ms超のフレーム 185/205(90%)。停止中は同じ throttle でも 16.67ms 安定(=再計算コストが原因と特定)
- 計測結果に基づき、再生中の再計算頻度を rAF(最大60Hz)から 15Hz へ間引き(`src/playback/playbackTime.ts` の `accumulatePlaybackTick` / `PLAYBACK_RECOMPUTE_INTERVAL_MS`)。カメラのtwinkle/driftは従来通り毎フレーム描画を維持し、星の位置再計算のみ間引く
  - 変更後: 1x throttle で平均 16.67ms/frame(33.3ms超 0件、完全に60fps安定)。4x throttle で平均 31.4ms/frame(約32fps)まで改善

完了確認:
- スマホ実機では未検証(要 Human Check)。相当の負荷環境(CPU throttling)では、間引き前と比べて明確に改善したことを確認済み

### Task 6 — オーバーレイ UI の整理

Status: Done

- 日時・場所オーバーレイに加えて、再生コントロール(再生/停止/速度/巻き戻し。Task 4 で実装済み)・視点/球面表示関連の最小 UI を追加する
- D009 の方向性(星空画面上へのオーバーレイ)を維持しつつ、コントロールが増えても煩雑にならないよう配置を整理する

実施内容:
- Task 3 の Human Check メモ(再生中「星が動いているのか画面がパンしているのか区別できない」)への対応として、人間確認のうえ**方位目印(N/E/S/W)の追加**を採用
  - 初回実装は星と同じくスカイスフィア上の固定 alt/az(高度0°)に3Dオブジェクトとして配置する方式(`src/render/cardinalMarkers.ts`)だったが、視点を大きく振ると目印自体が画面外に出てしまい「常に見える基準」として機能しないという人間からのフィードバックを受けて修正
  - 現在の実装は画面固定の2Dオーバーレイ(`src/CompassOverlay.tsx`)。カメラの現在の向き(heading)を `StarfieldRenderer.getHeadingDegrees()` で毎フレーム取得し、各方位ラベルの「現在の向きからの相対角度」に応じて画面上の左右位置を計算、画面端(左右)でクランプする(コンパスの方位帯のような見た目)。どの向きを見ていても必ずどこかの端か途中に表示される
  - `cardinalMarkers.ts` は削除。方位目印は3Dシーンではなく2D UI 層の責務にした(D003 の分離方針上、星の位置計算・見た目とは独立)
  - 星の見た目(shader・starVisualAttributes)や星の位置計算(`skyProjection.ts`)は変更していない
- オーバーレイ(DateTimeOverlay/LocationOverlay/PlaybackOverlay/CompassOverlay)の色・ボタンサイズ・配置マージンが各コンポーネントに重複していたため、`src/overlayStyles.ts` に集約。コントロールが増えても統一感を保てるようにした

完了確認:
- 通常状態では UI が目立たず、星空が主役であることを維持している(方位目印は低コントラストの小さいラベルのみ)
- 各コントロールが迷わず操作できる
- typecheck / lint / unit test / production build 成功、Playwright スモークテスト(`e2e/camera-controls-smoke.spec.ts`)で console error なしを確認
- Human Check 推奨: 方位目印の見た目(サイズ・濃さ・位置)がプラネタリウム的な落ち着きを壊していないか、実際の再生を見ながら確認

### Task 7 — コードレビュー

Status: Done

`/code-review high` (8観点の並列レビュー)で Task 1〜6 の差分を確認し、以下を修正した。

修正した実際のバグ:
- `CompassOverlay`(`normalizeBearing`)の角度ラップが `(-180, 180]` の意図に反し `[-180, 180)` になっており、方位が真後ろ(180°)に来た瞬間にラベルがストリップ全体を瞬間移動する不具合。純粋関数を `src/compassBearing.ts` へ切り出し修正 + 回帰テスト追加
- `cameraControls.ts` の `releasePointer` が、2本指ピンチから1本指へ減った際に `dragPointerId` を残った指へ再割り当てしておらず、スマホでピンチ後にドラッグ操作が効かなくなる不具合。再割り当てを追加 + テスト追加
- `PlaybackOverlay` の速度プリセットに存在しない初期値(60倍速)が設定されており、初回表示で速度セレクトの表示値が実際の再生速度と食い違う不具合。プリセットに含まれる `50` に修正
- `StarfieldRenderer` のアンビエントdrift位相が、タブの非表示→復帰でrAFループが再起動するたびにリセットされ、カメラ(および今回追加したコンパス表示)が復帰時にカクッと動く不具合。経過秒数を停止中も保持し、再開時に位相を継続するよう修正
- 実データ移行後、星の色カテゴリが実際のB-V色指数で分類されるようになった結果、白色比率が約48%まで下がり「白が基調で他は稀なアクセント」という方針(旧実装の白80%/青白12%/淡橙8%という重み付けと、そのテスト)から外れていた。人間確認のうえ、実カタログで概ね同等の比率(白約79%/青白約11%/淡橙約9%)になるよう閾値を再調整し、回帰テストを追加

設計上の重複解消(緊急ではないが3観点から独立に指摘):
- `clamp` / `DEG_TO_RAD` / `RAD_TO_DEG` / 角度ラップ計算が `coordinates.ts` / `skyProjection.ts` / `StarfieldRenderer.ts` に別々に実装されていたため、`src/mathUtils.ts` に集約
- `realStarDataSource.ts` で毎tick・星ごとに恒星時(sidereal time)を再計算していた箇所を、日時・場所が同じ間は不変な値として1回の呼び出しにつき1回だけ計算するよう修正(Task 5のパフォーマンス改善の延長)

対応を見送った指摘(重大度が低い、または今回のスコープを超えるため):
- `DateTimeOverlay`/`LocationOverlay` のトグルボタン+パネルのボイラープレート重複(共通コンポーネント化は将来の overlay 追加時に判断)
- `findLocationPreset` の等価比較によるフォールバック(緯度経度の自由入力に対応する将来タスクで再検討)
- 星ごとの静的な見た目属性(明るさ・色・twinkle)のキャッシュ化(現状 60fps 安定は確認済みのため、実機計測で必要になった場合に対応)

完了確認:
- 重大な指摘に対応済み。typecheck / lint / unit test(53件全通過)/ production build / Playwright スモークテスト、すべて成功

### Task 8 — 自動検証の仕上げ

Status: Done

- typecheck / lint / format:check / unit test / production build / e2e をすべて実行し、成功を確認した
  - typecheck: 成功(エラーなし)
  - lint: 成功(エラーなし)
  - format:check: 成功(全ファイル Prettier 準拠)
  - unit test: 53 件全通過(11 test files)
  - production build: 成功(chunk size 警告のみ、エラーなし)
  - e2e(`playwright test`, chromium + mobile-chrome): 4 件全通過、console error なし
- README.md / DEVELOPMENT.md の記載を、2次実装完了・Human Check 待ちの状態に更新した

完了確認:
- `phase-2-playback.md` の Acceptance Criteria(Automated / Technical)をすべて満たす
- 2次全体の Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
