# Phase 6 — Implementation Tasks

6次開発(保存・出力)を進めるためのタスク分割。
このフェーズは **Small Spec 未作成** のため、最初に Task 1 でスコープと方針を確定する。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `AGENTS.md`
3. `DEVELOPMENT.md`
4. `docs/TASKS.md`
5. `README.md`
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 関連コード(`src/Starfield.tsx`, `src/displayState.ts`, `src/*Overlay.tsx`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ。
- 6次は保存・出力系が対象であり、星の見た目の根幹(shader・`starVisualAttributes`)や既存の天文計算を壊さない。
- 永続化・共有・動画出力は、公開・セキュリティ・将来の商用利用に影響しやすいため、Task 1 で方針を先に固める。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り合理的に進めてよい。仮定は完了報告に書く。

## Task List

### Task 1 — 6次スコープ確定 + Small Spec 作成

Status: Done

結果(D020): 6次の初手は **最後の状態から再開** と **お気に入りシーンの最小保存** を優先し、初手の永続化は **ローカル保存** で完結させる。共有リンク、シーン共有、スクリーンショット、動画保存、サーバー保存、アカウント同期は 6次の初手のスコープに含めない。保存対象は「星空を再現するための状態」に絞り、開いているパネルや選択中 UI などの一時状態は持ち越さない。

- 6次で扱う保存・出力機能を `PRODUCT.md` の Save / Share 候補から絞り込んだ
- 優先順位を確定した
- 6次 Small Spec として `docs/features/phase-6-save-and-resume.md` を新規作成した
- `DECISIONS.md` に D020 を追加し、`PRODUCT.md`・`README.md`・`docs/TASKS.md` を整合させた

- 6次で扱う保存・出力機能を、`PRODUCT.md` の Save / Share 候補から絞り込む
- 優先順位を確定する
- `Goal / Acceptance Criteria / Out of Scope` を持つ 6次 Small Spec を新規作成する
- 必要なら `DECISIONS.md` に判断を記録し、`PRODUCT.md` と `README.md` の Current Phase を整合させる

確認論点の例:

- お気に入り地点 / お気に入りシーン / 最近使った場所 / 最後の状態から再開 のどれを先にやるか
- ローカル保存(`localStorage` 等)から始めるか、将来の共有前提の構造を先に持つか
- スクリーンショット / 動画保存 / 共有リンクを 6次に含めるか、後続へ送るか

完了確認:

- [x] 6次で実装する機能一覧(やらないことも含む)が確定している
- [x] 6次 Small Spec が作成されている
- [x] 関連ドキュメントが更新されている

### Task 2 — 保存対象の状態モデル整理

Status: Done

実装内容: `src/save/sceneState.ts` を新設し、保存対象を `SavedSceneState` として `dateIso` / `location` / `playback` / `view` / `display` に分離した。ここで扱うのは「星空を再現するための状態」のみで、開いているパネル・選択情報 open/close・自動非表示中かどうか等の一時 UI 状態は含めない。保存フォーマットは `PersistedSceneStateV1` として version を持たせ、将来の schema 変更と破損データ無視に備えた。

`createSavedSceneSnapshot()` / `createPersistedSceneState()` / `serializePersistedSceneState()` / `parsePersistedSceneState()` / `createDisplayStateFromSavedScene()` を追加し、serialize / restore 方針を純粋関数として切り出した。視点は `src/render/StarfieldRenderer.ts` に `getViewStateSnapshot()` / `restoreViewState()` を追加し、常時 drift を除いた user view(azimuth / altitude / fov)だけを保存対象にできるようにした。

`src/save/sceneState.test.ts` では以下を確認した。

- runtime state から restorable fields だけを snapshot 化すること
- persisted payload の serialize / parse が往復できること
- malformed / unsupported payload を安全に捨てること
- out-of-range 値を安全な範囲へ正規化すること
- restore 時に一時 chrome state を復活させないこと

- Task 1 で確定した保存対象を、既存 state から切り出して整理する
- 保存用の型定義と serialize / restore 方針を決める
- UI 状態と、保存すべき星空状態を分離する

完了確認:

- [x] 保存対象が型として明示されている
- [x] 既存 state と衝突せずに復元可能な構造になっている

### Task 3 — 最小の保存機能

Status: Done

実装内容: `src/save/sceneStorage.ts` を追加し、Task 2 で定義した `PersistedSceneStateV1` を `localStorage` へ保存する最小ラッパーを実装した。書き込み先は `veluna.savedScene.v1` の単一キーとし、保存失敗時は throw せず結果コード(`storage-unavailable` / `write-failed`)で返す。これにより Task 4 の復元実装前でも、永続化 I/O の責務を `Starfield.tsx` から切り離せる。

UI 側は `src/SaveSceneButton.tsx` を新設し、通常の星空画面上に小さな `シーン保存` ボタンだけを追加した。`src/Starfield.tsx` は現在の `date` / `location` / `playback` / `displayState` と、`StarfieldRenderer.getViewStateSnapshot()` が返す view snapshot を `createSavedSceneSnapshot()` 経由で保存する。保存後は短い `保存済み` 表示、失敗時は `保存失敗` 表示だけを出し、大きな保存管理 UI はまだ作らない。

`src/save/sceneStorage.test.ts` では以下を確認した。

- 保存と再読込が localStorage 経由で往復できること
- storage unavailable / write failure を throw せず扱えること
- malformed data を安全に無視できること

`src/Starfield.test.tsx` には、保存ボタンから現在のシーンが localStorage へ保存され、プリセット・プロジェクター補正・view snapshot が含まれることを追加で確認した。

- Task 1 で決めた最優先の保存機能を最小実装する
- 必要最小限の UI 導線を追加する
- 保存失敗時や不正データ時の最低限の防御を入れる

完了確認:

- [x] 保存が実際に機能する
- [x] 復元時に既存体験を壊さない

### Task 4 — 復元・再開フローの実装

Status: Done

実装内容: `src/Starfield.tsx` の初期化に `loadSceneFromStorage()` を接続し、保存済みシーンがあれば `date` / `location` / `speedMagnitude` / `direction` / `displayState` を初期 state として復元するようにした。描画側の view は `StarfieldRenderer.restoreViewState()` で mount 直後に復元し、保存時の azimuth / altitude / fov に戻る。これにより、ページを開き直した際に最後に保存したシーンから再開できる。

同時に、ユーザーフィードバックに合わせて 5次の標準モードでの UI 自動非表示を止めた。鑑賞モードは引き続き UI を退避するが、通常モードでは主要ボタンを残し続ける。また `DateTimeOverlay` / `LocationOverlay` の変更後は、対応するパネルを parent 側で自動的に閉じるようにした。

`src/Starfield.test.tsx` では以下を確認した。

- アプリ起動時に保存済みシーンが読み込まれ、view / preset / projector / immersive mode が復元されること
- 標準モードでは無操作でも主要ボタンが消えないこと
- 日時変更後にパネルが閉じること
- 選択情報を閉じた後も標準モードの chrome が残ること

- 保存した内容を再読み込み時または明示操作で復元できるようにする
- 「最後の状態から再開」を含める場合はこのタスクで扱う
- 復元対象外の一時 UI 状態を持ち越さないよう整理する

完了確認:

- [x] 再開・復元が意図どおり動く
- [x] UI の一時状態を不自然に引き継がない

### Task 5 — コードレビュー

Status: Done

実装内容: 保存・復元コードの責務分離と副作用を確認し、`src/Starfield.tsx` で復元済みシーンの `location.label` / `timeZoneId` を保持せず、再保存時に `findLocationPreset()` のフォールバック値で上書きしうる不具合を修正した。`locationMetadata` state を追加し、初回ロード時は保存済みメタデータをそのまま使い、場所を明示変更したときだけプリセット由来の値へ更新するよう整理した。

`src/Starfield.test.tsx` には、非プリセット相当の保存済みシーンを復元した直後に再保存しても、`timeZoneId` と `label` が維持される回帰テストを追加した。

- 保存・復元の責務分離、データ破損耐性、既存フェーズへの副作用を確認する
- 必要な修正と回帰テストを入れる

完了確認:

- [x] 重大な指摘がない、または対応済み

### Task 6 — 自動検証の仕上げ

Status: Done

実装内容: 保存・復元まわりを含む 6次の自動検証を通し、`src/Starfield.tsx` の初期保存シーン読込を `ref` ではなく初期化専用 state に整理して `react-hooks/refs` の lint 違反を解消した。これにより、保存済みシーンを初期値として使う処理は維持したまま、Task 6 の quality gate を通過できる状態になった。

検証結果:

- `npm run typecheck` 成功
- `npm run lint` 成功
- `npm test` 成功(24 files, 148 tests)
- `npm run build` 成功
- `npm run test:e2e` 成功(Chromium / mobile-chrome, 8 tests)

補足:

- production build では `dist/assets/index--MpKBjd_.js` が 500 kB 超のため Vite の chunk size warning が出るが、build 自体は成功し、Task 6 の Acceptance Criteria を妨げる error ではない
- Playwright 実行時に `NO_COLOR` と `FORCE_COLOR` の warning は出たが、テスト失敗や console error ではない

- typecheck / lint / unit test / production build / browser smoke test を通す
- 6次の Acceptance Criteria(Automated / Technical)を満たすことを確認する

完了確認:

- [x] 6次 Small Spec の Acceptance Criteria(Automated / Technical)を満たす
- [x] 6次全体が Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
