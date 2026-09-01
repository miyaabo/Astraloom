# Phase 8 — Implementation Tasks

8次開発(アカウント・同期)を進めるためのタスク分割。
このフェーズは Task 1 でスコープと Small Spec を確定済みとする。

## Replan Note (2026-09-01)

`DECISIONS.md` の D026 により、今後の forward plan は **Better Auth + ローカル PostgreSQL 優先** へ変更した。D025 の旧案は現在の主計画ではない。

したがって、このファイルの既存 Task 2 / 5 / 6 / 8 は「当時の前提に基づく実装記録」として保持しつつ、次の作業はそれらを前提に追加実装することではなく、8次の要件をローカル認証基盤中心に整理し直すこととする。

### Next Task (After D026)

- 8次 Small Spec を見直し、クラウド同期を必須から外すか将来候補へ戻す
- 認証の初手を `email + password` / `magic link` / `OTP` から選定する
- 開発段階ではローカル PostgreSQL、公開段階では Neon を含む外部配置を再検討する前提を明記する
- 既存の旧クラウド同期実装を保持するか、実験扱いにするか、後で削除するかを決める

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `AGENTS.md`
3. `DEVELOPMENT.md`
4. `docs/TASKS.md`
5. `README.md`
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 関連コード(`src/save/`, `src/Starfield.tsx`, `src/displayState.ts`, 各 overlay component)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ
- 8次では UI の作り込みより、認証・同期の基盤と安全性を優先する
- 既存の星空描画・主要天体系・検索・選択体験を壊さずに同期機能を追加する
- 認証・クラウド保存・同期状態は、既存の描画 state や保存 state へ安易に混ぜず、責務分離を維持する

## Task List

### Task 1 — 8次スコープ確定 + Small Spec 作成

Status: Done

結果(D024): 8次の初手は **認証とクラウド同期の最小基盤** を対象にし、サインイン / サインアウト / セッション復元、最後の状態と保存シーンのクラウド保存、同一アカウントでの複数端末同期、既存ローカル保存データの安全な移行を優先する。共有リンク、課金、公開向けプロフィール、大規模なアカウント管理 UI はこのフェーズの初手に含めない。

- `docs/features/phase-8-account-sync.md` を新規作成した
- `DECISIONS.md` に D024 を追加した
- `PRODUCT.md`、`README.md`、`docs/TASKS.md`、`DEVELOPMENT.md` の Current Phase / Roadmap を 8次へ更新した

完了確認:

- [x] 8次で実装する機能一覧(やらないことも含む)が確定している
- [x] 8次 Small Spec が作成されている
- [x] 関連ドキュメントが更新されている

### Task 2 — 認証方式と同期データ契約の選定

Status: Done

結果(D025, 現在は旧案): 8次の認証・同期基盤は当時 `Supabase Auth + Supabase Postgres` を前提に整理していた。現在の forward plan では採用しない。

ローカル保存からクラウド保存への移行は、未ログイン時は `localStorage` 継続、初回サインイン時にクラウド未保存ならローカル snapshot を移行、両方ある場合は `savedAtIso` 比較で新しい方を採用する。競合解決は field-level merge を行わず、snapshot 単位の last-write-wins とした。同時刻競合の tie-break は cloud 優先とする。

関連更新:

- `DECISIONS.md` に D025 を追加した
- `docs/features/phase-8-account-sync.md` に当時の採用方針と sync contract を追記した

- auth provider / backend / database の候補を比較し、商用利用条件・実装速度・運用負荷・セキュリティを整理する
- 同期対象を 6次の保存モデルとどう対応付けるか決める
- ローカル保存からクラウド保存への移行方針、競合時の merge 方針、未ログイン時のフォールバックを整理する
- 必要なら `DECISIONS.md` に記録する

完了確認:

- [x] 認証方式と同期 contract の方針が明示されている
- [x] 既存保存モデルとの接続方針が決まっている

### Task 3 — 同期用 state model / repository 境界の整理

Status: Done

実装内容: `src/sync/` を新設し、`authState.ts` で provider 非依存の `AuthState` / `AuthenticatedUser` と初期・signed-in・signed-out・error の基本状態を定義した。`syncState.ts` では `SyncState` を `auth state` や描画 state と分離し、`idle` / `pending-upload` / `syncing` / `migrating` / `error` の最小状態遷移と、`sourceOfTruth` / `lastSyncedAtIso` / `hasPendingLocalChange` を保持する構造にした。

repository 境界は `src/sync/sceneRepository.ts` に集約し、`SceneStore` interface を local / cloud 共通の read-write port として定義した。あわせて D025 当時の競合ルールを `resolveSceneConflict()` に切り出し、snapshot 単位の last-write-wins と cloud tie-break をコード化した。`src/save/localSceneStore.ts` を追加し、既存の `sceneStorage.ts` を local adapter として包むことで、`src/save/` は引き続き local 永続化の責務に留め、将来の別 DB adapter にも接続できる形にした。

テストは `src/sync/authState.test.ts`、`src/sync/syncState.test.ts`、`src/sync/sceneRepository.test.ts` を追加し、auth/sync 状態モデル、競合解決ルール、既存 `localStorage` 保存コードが shared interface の背後で動くことを確認した。

- auth state / sync state / persisted scene state を分離した型と境界を定義する
- ローカル保存とクラウド保存の両方を扱う repository interface を切り出す
- `src/save/` と将来の cloud adapter の責務境界を作る

完了確認:

- [x] 同期用の型と境界が明示されている
- [x] 既存の保存コードと衝突しない構造になっている

### Task 4 — 認証 session 管理の最小実装

Status: Done

実装内容: `src/sync/authClient.ts` に旧認証 provider を包む provider 非依存の `AuthClient` port を追加し、`getSession()` / `signInWithOtp()` / `signOut()` / `onAuthStateChange()` を最小面積で定義した。現時点の主計画では、この port を Better Auth 前提へ置き換える想定。

`src/sync/AuthSessionProvider.tsx` では App mount 時の session restore、auth change subscription、sign-out 後の state clear、restore failure 時の `error` state への退避を実装した。`src/App.tsx` はこの provider で `Starfield` を包むように変更したが、UI はまだ追加していないため、未ログイン時の既存星空利用はそのまま維持される。Task 4 時点では UI 導線を増やさず、Task 7 以降で `useAuthSession()` を使ってサインイン表示へ接続できる土台に留めた。

テストは `src/sync/authClient.test.ts` と `src/sync/AuthSessionProvider.test.tsx` を追加し、env 未設定時の signed-out fallback、既存 session の復元、restore failure の error state、auth change subscription を確認した。

- サインイン / サインアウト / セッション復元の最小実装を追加する
- 未ログイン時とログイン時の state 遷移を安全に扱う
- 認証失敗時や期限切れ時の最低限のフォールバックを入れる

完了確認:

- [x] 認証状態を保持・復元できる
- [x] 未ログイン時の既存利用が壊れない

### Task 5 — 旧クラウド保存 adapter の実装

Status: Done

実装内容: 旧クラウド保存 adapter を追加し、Task 2/3 で定義した `SceneStore` port の cloud 実装として扱っていた。現在の主計画では採用しない。

最低限の防御として、未認証は `auth-required`、オフラインは `offline`、読み書き失敗は `read-failed` / `write-failed`、row 不在は `not-found` を返すように整理した。これに伴い `SceneStoreReadResult` / `SceneStoreWriteResult` は `offline` を扱えるよう更新した。既存 `src/save/` の local adapter には手を入れず、cloud 固有ロジックは `src/sync/` に閉じ込めている。

テストは当時の adapter に対して env 解決、認証済みユーザーの読み込み、未認証、オフライン、読み書き失敗、row 不在、canonical payload の upsert を確認した。

- Task 2/3 で決めた contract に沿って、保存シーンと最後の状態をクラウドへ保存する adapter を実装する
- 読み書き失敗時やオフライン時の扱いを整理する
- ローカル保存との責務分離を維持する

完了確認:

- [x] クラウド保存が実際に機能する
- [x] 失敗時の最低限の防御がある

### Task 6 — 旧ローカル保存からクラウド保存への移行

Status: Done

実装内容: `src/sync/sceneMigration.ts` を追加し、旧クラウド保存前提での local/cloud 移行ロジックを実装した。現在の主計画では forward path ではないが、将来の DB 保存移行を考える際の参考としては残る。

防御として、未ログイン時は `skipped-auth-required`、オフライン時は `skipped-offline`、local read failure は `local-read-failed`、cloud read/write failure は `cloud-read-failed` / `cloud-write-failed`、local overwrite failure は `local-write-failed` を返し、利用可能なローカル snapshot を勝手に消さないようにした。これにより、Task 8 のフロー統合前でも「移行アルゴリズムと競合時の挙動」はコードとして固定された。

テストは `src/sync/sceneMigration.test.ts` を追加し、local-only 初回移行、cloud-newer 復元、同時刻 cloud-wins、未ログイン、オフライン、local read failure、cloud write failure を確認した。

- 既存 `localStorage` の保存データを安全に検出し、必要時にクラウド側へ移行する
- 重複や競合がある場合の最小 merge ルールを実装する
- 移行後もローカル利用だけで破綻しないようにする

完了確認:

- [x] 既存保存データを安全に移行できる
- [x] 競合時の挙動が明示されている

### Task 7 — 最小のアカウント / 同期 UI

Status: Done

実装内容: `src/AccountSyncOverlay.tsx` を追加し、既存の top-right overlay row と同じ密度で `アカウント・同期` パネルを差し込んだ。閉じた状態では `ローカル保存` / `認証確認中` / `同期準備OK` などの最小ラベルだけを見せ、開いたときだけ詳細状態と操作を表示する。これにより星空鑑賞を常時邪魔せずに、現在がローカル利用か、サインイン済みで同期準備可能かを把握できる。

`src/Starfield.tsx` は `useAuthSession()` を通じて auth state と command を受け取り、`displayState` の単一 panel 制御に `account` を追加した。旧 provider 未設定環境では sign-in ボタンを無効化しつつローカル保存継続を明示し、設定済み環境では sign-in メール送信と sign-out を最小導線で扱えるようにした。現在の主計画では、ここを Better Auth 前提へ差し替える想定。

テストは `src/Starfield.test.tsx` に追加し、未設定時の local-only 表示、設定済み client での sign-in mail 送信、auth change 後の signed-in 表示、sign-out 導線を確認した。

- 星空鑑賞を壊さない最小のサインイン導線と同期状態表示を追加する
- 既存オーバーレイ構成と整合するようにする
- 大規模な管理画面を作らず、必要最小限の操作だけを見せる

完了確認:

- [x] 認証と同期状態を最小 UI で扱える
- [x] 星空体験の静けさを大きく壊していない

### Task 8 — 旧複数端末での再開 / 同期フロー統合

Status: Reverted

旧クラウド同期フローは一度接続したが、要件見直しにより現在は巻き戻している。現行コードではこのタスクの orchestration は接続していない。

- ログイン済みユーザーが別端末でも同じ星空へ戻れるフローを接続する
- アプリ起動時や保存時の同期タイミングを整理する
- 既存の保存・再開体験との回帰がないか確認する

完了確認:

- [ ] 複数端末で保存状態を再利用できる
- [x] 既存のローカル再開体験に重大な回帰がない

### Task 9 — セキュリティレビュー

Status: Not Started

- 認証・保存・同期の責務分離、秘密情報の扱い、既存フェーズへの副作用を確認する
- 必要な修正と回帰テストを入れる

完了確認:

- [ ] 重大な指摘がない、または対応済み

### Task 10 — 自動検証の仕上げ

Status: Not Started

- typecheck / lint / unit test / production build / browser smoke test を通す
- 8次 Small Spec の Acceptance Criteria(Automated / Technical)を満たすことを確認する

完了確認:

- [ ] 8次 Small Spec の Acceptance Criteria(Automated / Technical)を満たす
- [ ] 8次全体が Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
