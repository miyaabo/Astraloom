# Phase 4 — Implementation Tasks

4次開発(`docs/features/phase-4-relaxation.md`)を実装するためのタスク分割。
セッションをまたいで進めるための作業単位であり、Feature Spec 自体の代わりにはならない。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `CLAUDE.md`
3. `DEVELOPMENT.md`
4. `docs/features/phase-4-relaxation.md`
5. `docs/features/phase-3-star-knowledge.md`(3次の前提、Done)
6. `DECISIONS.md`
7. このファイル(現在の進捗確認)
8. 既存コード(`src/stars/starfieldConfig.ts`, `src/playback/`, `src/Starfield.tsx`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ(自動で連続実行しない)。
- Out of Scope(`phase-4-relaxation.md` 参照)には手を出さない。3次資産(星座線・星座名・星名・検索・星情報)には手を入れない。
- 星の見た目(shader・`starVisualAttributes`・位置計算)・カメラ/再生エンジンの根幹ロジックは 0次〜3次の資産をそのまま使う。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り質問せず合理的に進めてよい。仮定は完了報告に書く。
- Task 1(スコープ確定・技術方針確認)は複数の独立した機能領域・商用利用条件の判断を含むため、必ず人間確認のうえで先へ進む。

## Task List

### Task 1 — 4次スコープ確定 + 技術方針確認

Status: Done

- `phase-4-relaxation.md` の Scope Candidates(Sound / View・Rendering / Playback・Session)から、実際に4次で実装する機能と優先順位を人間と確定する
- Sound(内蔵 BGM/環境音)を採用する場合、商用利用条件が明確な音源候補を提示し人間確認を得る
- 天の川・地平線／風景を実装する場合の技術方針(画像アセット vs 既存 shader の拡張)と、アセットを使う場合のライセンスを確定する
- 確定した内容を `DECISIONS.md`(D018〜)・`PRODUCT.md`・`phase-4-relaxation.md` へ反映する

結果(D018): 4次のスコープは **天の川・地平線/風景** のみとし、既存の星 shader の延長で実装する(画像アセット不使用)。Sound / その他の表現プリセット / スリープタイマー等は今回のスコープに含めない。

完了確認:

- [x] 4次で実装する機能一覧(やらないことも含む)が確定し、`DECISIONS.md` に記録されている(D018)
- [x] 音源・画像アセットを採用する場合、Veluna の将来の商用利用を妨げないことを確認済み — 画像アセットを使わない方針のため該当なし
- [x] `phase-4-relaxation.md` の Scope / Out of Scope が確定した内容に更新されている

### Task 2 — 天の川の実装(shader 拡張)

Status: Not Started

- 既存の星 shader / renderer(`src/render/` 配下)を拡張し、天の川を星と同じ描画パイプライン上にパーティクル/シェーダーの密度・グロー表現として追加する
- 天の川の帯としての位置・形状は、天球上で妥当に見える簡略化表現でよい(正確な銀河座標変換は必須としない。固定的な帯状配置で妥当な見え方になるかを Human Check で判断する)
- 天の川用の調整パラメータ(密度・明るさ・帯の幅など)は `starfieldConfig.ts` 等、既存の一元管理設定に追加する(D004)
- Product Principle 1(プラネタリウム基準, D011)・5(Calm by Default)を壊さない密度・明るさに調整する。星より目立たせない

完了確認:

- 天の川が球面星空上に表示され、視点移動・ズームでも破綻しない
- 星の既存の見た目(shader・`starVisualAttributes`)に影響を与えていない
- typecheck / lint / unit test / build が成功する
- PC・スマホで表示崩れがない

### Task 3 — 地平線/風景の実装(shader 拡張)

Status: Not Started

- 既存 shader の延長でシンプルな地平線/風景表現(シルエットやグラデーション等)を追加する。具体的な形状は実装時に合理的に判断してよい
- 視点操作(ドラッグ・ズーム)や再生(時間経過)と組み合わせても破綻しないようにする
- 地平線用の調整パラメータを既存の一元管理設定に追加する(D004)

完了確認:

- 地平線/風景が球面星空上に表示され、視点移動・ズーム・再生と組み合わせても破綻しない
- typecheck / lint / unit test / build が成功する
- PC・スマホで表示崩れがない

### Task 4 — コードレビュー

Status: Not Started

Task 2・3 の実装内容を対象にコードレビューを行う(0〜3次の Task 8/7 相当)。

### Task 5 — 自動検証の仕上げ

Status: Not Started

typecheck / lint / unit test / production build / browser smoke test を通し、`phase-4-relaxation.md` の Acceptance Criteria(Automated / Technical)を満たすことを確認する。

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
