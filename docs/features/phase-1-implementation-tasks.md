# Phase 1 — Implementation Tasks

1次開発(`docs/features/phase-1-real-sky.md`)を実装するためのタスク分割。
セッションをまたいで進めるための作業単位であり、Feature Spec 自体の代わりにはならない。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `CLAUDE.md`
3. `DEVELOPMENT.md`
4. `docs/features/phase-1-real-sky.md`
5. `docs/features/phase-0-starfield.md`(0次の前提)
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 既存コード(`src/stars/`, `src/render/`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ(自動で連続実行しない)。
- Out of Scope(`phase-1-real-sky.md` 参照)には手を出さない。
- 星の「見た目」(shader・config)は 0次の資産をそのまま使う。位置計算の置き換えに専念する。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り質問せず合理的に進めてよい。仮定は完了報告に書く。

## Task List

### Task 1 — 星カタログ選定 + 商用利用確認

Status: Done

- 候補カタログ(例: Hipparcos, Yale Bright Star Catalog, HYG Database 等)を調査
- 商用利用条件、必要な星数、等級・色データの有無、配布/再配布条件を比較
- 比較結果を人間へ提示し、正式採用を決定する(D005 により、実装前に人間確認が必須)

完了確認:
- 採用カタログが決定し、`DECISIONS.md` に記録されている
- ライセンス上、Veluna の将来の商用利用を妨げないことを確認済み

### Task 2 — 星データ導入・前処理

Status: Done

- 採用カタログから赤経・赤緯・視等級・色情報を抽出する前処理を実装
- 0次と同程度の見かけ密度になるよう等級でフィルタして軽量化
- `src/stars/starTypes.ts` を実データに必要な形へ拡張(既存の brightness/color/twinkle 関連の型は維持)
- 仮データ生成(`starDataSource.ts`)は実データソースへ差し替え、または並存させて切り替え可能にする

完了確認:
- unit test でデータ件数・値の範囲(赤経赤緯・等級)を確認
- まだ画面表示・座標変換はしない

### Task 3 — 天文座標変換の実装

Status: Done

- 恒星時計算、赤道座標(赤経・赤緯) → 指定した緯度経度・日時における地平座標(alt/az)への変換を実装
- 自前実装か軽量ライブラリ利用かを判断し、ライブラリ採用時は商用利用条件を確認する
- 位置計算ロジックは 0次の見た目レイヤーと分離した module に置く(D003)

完了確認:
- 既知の明るい星(シリウス、ベガ等)について、既知の天文データと近い alt/az が算出されることを unit test で確認する

### Task 4 — 固定の日時・場所で実データを接続(walking skeleton)

Status: Done

- コード内に固定の緯度経度・日時を置き、実データ → 座標変換 → 0次の `StarfieldRenderer` に接続
- alt/az を 0次の平面表示座標へマッピングする層を追加(将来の球面表示を妨げない形に留める)
- UI での日時・場所入力はまだ作らない

完了確認:
- ブラウザで実データに基づく星空が表示される
- Human Check(実際の星の並びとして違和感がないか)

### Task 5 — 日時指定 UI(最小)

Status: Done

- 星空画面へのオーバーレイとして最小限の日時指定 UI を追加(D009 の方向性に沿う)
- 日時変更で星の並びが再計算されることを確認

完了確認:
- 日時を変えると星の並びが妥当に変化する
- 通常状態では UI が表示されず、星空が主役であることを維持している

### Task 6 — 場所指定 UI(最小)

Status: Done

- 緯度経度直接入力、または限定都市リストなど最小の場所指定手段を追加
- 本格的なジオコーディング API 連携は行わない(Out of Scope)

完了確認:
- 場所を変えると星の並びが妥当に変化する

### Task 7 — タイムゾーン処理

Status: Done

- 日時・場所計算が破綻しない範囲でタイムゾーンを扱う(表示のみのローカライズか、内部 UTC 統一かは実装時に判断)

完了確認:
- 場所をまたいで日時を指定しても、星空の計算がずれない

### Task 8 — コードレビュー

Status: Done

- `/code-review` で Task 1〜7 の差分をレビュー(責務分離、マジックナンバー化、不要な抽象化・依存がないか等)
- 指摘があれば修正し、再確認する

完了確認:
- 重大な指摘がない、または対応済み

### Task 9 — 自動検証の仕上げ

Status: Done

- typecheck / lint / unit test / production build / e2e を一通り実行し確認
- README / DEVELOPMENT の記載を最終状態に更新

完了確認:
- `phase-1-real-sky.md` の Acceptance Criteria(Automated / Technical)をすべて満たす
- 1次全体の Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
