# Phase 10 — Atmosphere Presets And Display Settings

## Status

Task 1(スコープ確定・Small Spec 作成)完了(D028)。次は Task 2(設定可能項目の棚卸し)。

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
