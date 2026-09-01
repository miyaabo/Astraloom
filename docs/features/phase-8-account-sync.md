# Phase 8 — Account And Sync

## Status

Task 1(スコープ確定・Small Spec 作成)完了後に進めていたが、2026-09-01 時点で D026 により前提を見直し中。8次は当面、共有や課金より先に **認証基盤の整理** を優先し、クラウド同期は必須から外した。

前フェーズ: `docs/features/phase-7-celestial-bodies.md`(Done)。7次で主要天体まで含む表示体験が整ったため、次はその星空体験を複数端末でも継続できるようにする。

## Goal

Note: この Small Spec は D025 前提の内容を含んでおり、D026 採択後は再整理対象になっている。以下は当時の整理を保持したもので、現行の forward plan ではない箇所がある。

ログイン機能の土台を整え、将来の DB 保存へ安全に接続できる状態にする。

現時点の Veluna は、恒星・主要天体・再生・視点・保存再開までをローカル端末内で完結できる。一方で、将来ログイン機能を入れるなら、認証の責務と保存先 DB との接続方針を先に整理しておいた方が安全である。8次では、見た目や情報量を大きく増やさず、最小の認証と DB 保存前提の境界整理を優先する。

## Background / Reference

- `PRODUCT.md` — Product Vision、Product Principle 2/5/6/7、Current Phase
- `DEVELOPMENT.md` — Phase Roadmap: 8次
- `DECISIONS.md` — D007(0次で backend 不要)、D009(オーバーレイ方向)、D020(ローカル保存方針)、D024(8次スコープ)
- `docs/features/phase-6-save-and-resume.md` — 6次 Small Spec(Done)
- `docs/features/phase-7-celestial-bodies.md` — 7次 Small Spec(Done)
- 既存コード: `src/save/`, `src/Starfield.tsx`, `src/displayState.ts`, 各 overlay component

## Scope(Replanned after D026)

- **認証**
  - サインイン
  - サインアウト
  - セッション復元
- **DB 保存の前提整理**
  - 将来、最後の状態や保存シーンを PostgreSQL へ保存できる境界を整理する
  - 認証状態と保存状態の責務分離を維持する
- **最小 UI**
  - 星空体験を壊さない最小の状態表示と操作導線だけを追加する

### 8次で優先する技術論点

- auth provider / database の商用利用条件と運用負荷
- 認証方式の初手選定(`email + password` / `magic link` / `OTP`)
- PostgreSQL 保存対象の contract
- 認証状態と星空 UI の責務分離
- セキュリティ上の最小要件

## Out of Scope(8次では作らない)

- 共有リンク
- シーン共有
- 課金
- 公開向けプロフィール
- アカウント削除
- 詳細なプライバシー設定 UI
- 大規模なアカウント管理画面

上記は「不要」ではなく、8次の初手では扱わない。

## Technical Direction

- 6次で定義した保存対象(`SavedSceneState`)を土台にし、将来 DB 保存する対象は「星空を再現するための状態」に限定する
- 認証状態、保存状態、ローカル保存状態は分離し、既存の描画・天文計算・主要天体系へ直接混ぜない
- 最初から巨大なアカウント UI は作らず、D009 の方向性に沿う最小のオーバーレイ導線に留める
- 認証は **Better Auth**、開発中の DB は **ローカル PostgreSQL** を第一候補とする(D026)
- 本番段階で外部配置が必要になった場合のみ、Neon を含む managed PostgreSQL を再検討する(D026)
- 未ログイン時でもローカル利用が破綻しないフォールバックを維持する

## Current Direction(D026)

### 採用方針

- auth provider: Better Auth
- database: PostgreSQL
- 開発段階の DB 配置: ローカル PostgreSQL
- 本番段階の候補: 自前運用または Neon 上の PostgreSQL
- メール送信: 自前で選ぶメール送信基盤
- 初手の認証方式: 未確定。`email + password` / `magic link` / `OTP` を比較して決める

### 保存 contract の方向

- canonical payload は 6次で導入済みの `PersistedSceneStateV1`
- まずは 1 ユーザーにつき 1 件の最新 scene snapshot を扱う前提でよい
- DB record は `user_id` / `scene_version` / `scene_payload` / `saved_at_iso` / `updated_at` を最小候補とする
- `scene_payload` の中身は `SavedSceneState` 相当の JSON とし、破損データや schema 差分の正規化は既存 parser に寄せる

### ローカル保存との接続方針

- 未ログイン時は `localStorage` 継続。DB 保存を必須にしない
- 既存ローカル snapshot から DB 保存へ移すかどうかは、認証導入後に改めて決める
- 複数端末同期や競合解決は現時点では要件に含めない

### Out of Scope For Current 8th Phase

- クラウド同期
- 複数端末の競合解決
- 複数保存スロット
- 共有リンクを前提にした ACL
- field-level merge
- アカウント削除や課金と結びつく identity 設計

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- 認証 state の主要分岐を unit test で確認する
- ローカル保存との回帰がないことを確認する
- console error なし

### Human Check

- サインイン導線が星空鑑賞の邪魔にならない
- 未ログイン時とログイン時の挙動差が分かりやすい
- PC・スマホ縦画面で破綻しない

## Questions Claude May Ask

過去の Task 1 では以下を前提にしていたが、D026 により再整理対象になった。

- 8次の初手は何か → 認証とクラウド同期の最小基盤
- 共有リンクや課金を同時に進めるか → 進めない
- 大規模なアカウント管理 UI を先に作るか → 作らない

現時点では以下を決め直す必要がある。

- 8次の初手は何か → 認証基盤だけで十分か
- 認証方式は何か → `email + password` / `magic link` / `OTP`
- DB 保存はこのフェーズに含めるか → 含めるならどこまでか
