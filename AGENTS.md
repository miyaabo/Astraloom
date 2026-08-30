# CLAUDE

このファイルは Claude Code が毎回参照する常設指示。
詳細仕様書ではなく、プロジェクトで繰り返し守る高シグナルなルールだけを記載する。

## Read First

作業開始時は以下を順に読む。

1. `PRODUCT.md`
2. `CLAUDE.md`
3. `DEVELOPMENT.md`
4. 対象機能に関連する `docs/features/`
5. 必要なら `DECISIONS.md`
6. 既存コードと関連テスト

0次開発では必ず以下も確認する。

- `docs/features/phase-0-starfield.md`
- `docs/references/phase-0-visual-target.png`

## Product Guardrails

以下は実装都合だけで変更してはならない。

- Product Purpose
- Product Vision
- Product Principles
- 現在フェーズの Goal
- 重要な成功条件
- Visual Target の基本方向性

変更が必要だと判断した場合は、勝手に変更して実装せず、人間へ提案する。

## Current Technology

0次開発の基本技術:

- TypeScript
- React
- Vite
- Three.js / WebGL
- custom shader
- Vitest
- Playwright
- ESLint
- Prettier

既存の技術選定を変更する前に `DECISIONS.md` を確認する。
大きなスタック変更は人間に確認する。

## Visual Target Rule

0次開発の星空表現は、**文章だけではなく画像も要件**とする。

対象:

- `docs/references/phase-0-visual-target.png`

この画像は単なる雰囲気参考ではない。
完全なピクセルコピーは不要だが、以下はこの方向性から大きく外れないこと。

- 星のサイズ感
- 明るい星と暗い星の階層
- グローの強さ
- 背景の暗さ
- 全体の密度感
- 「プラネタリウムらしい」見え方

## Architectural Direction

### Separate Placement from Appearance

星の「どこにあるか」と「どう見えるか」を分離する。

最低限、以下の責務を混ぜない。

- Star source/data
- Star placement/projection
- Star visual parameters
- Star renderer
- Animation/twinkle
- View/camera

0次は平面表示でよいが、完成系で球面表示へ拡張できる余地を残す。
ただし、将来の球面表示のために不要な抽象化を大量に作らない。

### Rendering Quality First

0次では星の見た目が最優先。

機能追加より以下の調整を優先する。

- brightness
- size
- color
- glow
- blur / halo
- density
- background
- twinkle
- motion subtlety

星空表現用の主要パラメータは一箇所に集約し、人間が調整しやすくする。

### Mobile Is Not a Reduced Product

PC だけ高品質にし、スマホを大幅に簡略化しない。

端末性能差への対策として、内部的に以下を調整してよい。

- device pixel ratio cap
- star count
- shader quality
- effects quality

ただし見た目の方向性を変えない。

## 0次 Development Rules

0次では以下を追加しない。

- ユーザー向け設定 UI
- 日時／場所
- 実データ
- 星座
- 天体情報
- 音
- アカウント
- 課金
- 動画保存
- 流れ星
- 天の川
- 地平線
- AR

「簡単だからついでに作る」を禁止する。
現在フェーズの目的に直接寄与しない機能は後回しにする。

## Question Policy

要件が決まっていない場合、何でも質問して止まらないこと。

### 人間へ質問するべき場合

以下のどれかに当てはまる場合のみ、実装前に短く質問する。

- Product Principles に影響する
- 見た目／UX の結果が大きく変わる複数案があり、PRODUCT や Feature Spec と Visual Target から判断できない
- 大きな技術スタック変更が必要
- データ破壊・公開・課金・セキュリティ上の不可逆判断がある
- 商用利用可否が不明な外部データ／ライブラリを中核採用する必要がある
- スコープを大幅に変える必要がある

質問するときは **1回に1つの論点** を優先する。

### 質問せず進めるべき場合

以下は Claude Code が合理的な仮定を置いて進める。

- 小さな実装詳細
- ファイル名
- 内部関数名
- 軽微なコード構造
- 実装後に簡単に変更できるもの
- 既存コードや Feature Spec から自然に推論できるもの

仮定を置いた場合は、完了報告で簡潔に示す。

### 未決定事項を勝手に製品仕様へ昇格しない

将来候補リストにあるものを「実装決定済み」と扱わない。
そのフェーズで必要になった時点で Small Spec を作るか、人間へ確認する。

## Standard Work Loop

実装時は原則:

1. Explore
2. Plan
3. Build
4. Verify
5. Human Check を依頼
6. 必要なら Iterate

既存コードを読まずに実装しない。
見た目中心の機能では、長時間一気に自走しすぎず、途中の Human Check を優先する。

## Testing / Verification

可能な範囲で以下を行う。

- TypeScript type check
- Lint
- Unit test
- Browser smoke test
- Production build

0次開発では特に以下を確認する。

- Chrome desktop で表示できる
- mobile viewport で破綻しない
- WebGL エラーがない
- console error がない
- 1 分以上動作して破綻しない
- 不要なメモリ増加や明らかな FPS 低下がない
- prefers-reduced-motion 時にも利用可能

### Visual Quality

星空の品質は自動テストだけで完了判定しない。
Human Check 必須。

人間に以下を確認してもらう。

- 夜空として自然か
- プラネタリウムらしいか
- 星のサイズが大きすぎないか
- グローが強すぎないか
- 色がカラフルすぎないか
- 瞬きがうるさくないか
- 背景が明るすぎ／黒すぎないか
- スマホでも同じ印象か
- Visual Target から大きく外れていないか

## Security Baseline

0次から守る。

- 秘密情報・API キーをフロントエンドコードへハードコードしない
- `.env` に置けば秘密になると誤解しない。Vite でクライアントに露出する値は公開情報として扱う
- `innerHTML` 等で未検証データを直接描画しない
- 不要な外部スクリプトを追加しない
- 依存ライブラリを増やす前に必要性を確認する
- lockfile を使用する（Git 管理開始後は必ずコミットする）
- 依存パッケージの既知脆弱性を確認する
- 外部データ導入時は型・範囲・欠損を検証する

将来の認証・課金・ファイルアップロードについては、そのフェーズ開始時にセキュリティ要件を Small Spec へ追加する。

### Future Upload Security

音楽アップロードを実装する場合:

- 許可形式を限定
- MIME だけを信用しない
- サイズ上限
- ファイル名を信用しない
- 実行可能ファイルとして扱わない
- Object URL を使う場合は適切に revoke
- クラウド保存する場合は認可と隔離を設計

## Performance Rules

星空アプリではスマホ性能を重視する。

- DOM 要素を星の数だけ作らない
- Three.js の BufferGeometry / GPU 描画を優先
- 毎フレーム大量の JS オブジェクトを生成しない
- `requestAnimationFrame` を使用
- resize / DPR 変更を安全に処理
- background tab で不要に処理を続けない
- 端末性能に応じて負荷を調整可能にする
- 最適化は計測に基づいて行う

## Coding Rules

- TypeScript strict
- `any` を安易に使わない
- renderer に React UI の責務を混ぜない
- 描画設定をマジックナンバーとして散らさない
- コメントは「なぜ」を優先
- 不要な抽象化を作らない
- 将来機能を先回りして実装しない
- 現在フェーズで使わない依存を追加しない

## Documentation Rules

変更後、将来の判断に必要な場合のみドキュメントを更新する。

更新候補:

- PRODUCT.md: Product のスコープ・原則が変わる場合（人間承認必須）
- CLAUDE.md: 繰り返し必要な開発ルールが判明した場合
- DEVELOPMENT.md: 標準フローが変わる場合
- DECISIONS.md: 後から変更コストが高い重要判断
- docs/features/: Feature の Goal / Acceptance Criteria / Out of Scope
- docs/references/: Visual Target の差し替え・追加

一度しか使わない作業ログは残さない。

## Git

現時点では Git 管理開始前。

人間から指示されるまで以下を勝手に行わない。

- `git init`
- GitHub repository 作成
- remote 設定
- push

## Completion Report

作業完了時は簡潔に以下を報告する。

- 何を変更したか
- 何を検証したか
- Acceptance Criteria の結果
- Human Check してほしい点
- 置いた仮定
- 残っている問題

長い作業日誌は不要。
