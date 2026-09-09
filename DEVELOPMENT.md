# DEVELOPMENT

## Development Philosophy

```text
Product は固定する。
Implementation は柔軟にする。

小さく作る。
実物を見る。
必要な仕様だけ後から決める。
```

人間は WHY / WHAT / PRIORITY / DONE を握る。
Claude Code は HOW を広く担当する。

## Standard Flow

```text
Idea / Feature
    ↓
必要なら Small Spec
    ↓
Explore
    ↓
Plan
    ↓
Build
    ↓
Verify
    ↓
Human Check
    ↓
Iterate
```

### Small Spec

仕様を明示した方が安全な機能のみ作成する。

最低限:

- Goal
- Acceptance Criteria
- Out of Scope

必要なら:

- UX intent
- Constraints
- Edge cases
- Security considerations
- Visual references

実装詳細を過度に固定しない。

### Explore

Claude Code は以下を調査してから Plan する。

- PRODUCT.md
- CLAUDE.md
- Feature Spec
- Visual Target
- 関連コード
- 関連テスト
- 既存アーキテクチャ
- 採用済みライブラリ

### Plan

必要に応じて整理する。

- 変更対象
- 実装方針
- 重要な設計判断
- テスト方法
- リスク

細かな Sub-task を大量に人間承認させない。

### Build

- 最小変更
- 既存設計との整合性
- 不要な抽象化を避ける
- 将来機能を先回りしない
- 計測前の過剰最適化をしない

### Verify

- unit test
- type check
- lint
- browser smoke
- build
- 必要なら performance 確認
- Acceptance Criteria 確認

### Human Check

特に以下は人間評価を優先する。

- 星の見た目
- 夜空の雰囲気
- プラネタリウムらしさ
- UI の没入感
- 操作感
- スマホ実機
- プロジェクター利用時の印象
- Visual Target との方向性一致

## Phase Roadmap

このロードマップは詳細仕様ではない。
フェーズ開始時に必要性を再確認し、不要なものは作らない。

### 0次 — プラネタリウム基準の星空表現(Done)

目的:

> 完成系につながる、プラネタリウムらしい星空表現を作る。

主対象:

- Three.js / WebGL 描画基盤
- 仮星データ
- 星の色／明るさ／サイズ
- ごく控えめなグロー／にじみ
- 暗く落ち着いた背景
- 控えめな瞬き
- 最低 1 分程度の連続アニメーション
- PC / スマホ縦画面
- 表現パラメータの内部一元管理
- Visual Target とのすり合わせ

ユーザー向け設定 UI は作らない。

### 1次 — 本物の夜空(Done)

Small Spec: `docs/features/phase-1-real-sky.md` / タスク分割: `docs/features/phase-1-implementation-tasks.md`

目的:

> 信頼できる実データから、場所と日時に対応する星空を再現する。

候補:

- 星カタログ選定
- 商用利用条件確認
- 実星データ導入
- 星データの前処理／軽量化
- 日時指定
- 世界中の都市・地域指定
- 天文座標変換
- タイムゾーン処理
- 最初の設定 UI
- 外部データ／API の安全な取り扱い

決定済み(詳細は `DECISIONS.md`):

- 星カタログ: HYG Database(D013)
- 天文計算: 自前実装(`src/astronomy/coordinates.ts`)。ライブラリは不採用
- 場所指定: 本格的な地名検索 API は使わず、最小の場所プリセットリスト(`src/locationPresets.ts`)
- バックエンド: 引き続き不要(D007 を維持)、前処理はビルド時(`scripts/build-hyg-catalog.mjs`)

### 2次 — 時間を流して眺める(Done)

Small Spec: `docs/features/phase-2-playback.md` / タスク分割: `docs/features/phase-2-implementation-tasks.md`

目的:

> 実際の星の流れを好きな速度で眺められる。

候補:

- 再生／停止
- 再生速度
- 巻き戻し
- 時間範囲
- 球面表示
- 平面／球面切替
- 視点移動
- ズーム
- 表示／時間／場所設定の整理
- スマホ負荷への自動品質調整

### 3次 — 星空を知る(Done)

Small Spec: `docs/features/phase-3-star-knowledge.md` / タスク分割: `docs/features/phase-3-implementation-tasks.md`

目的:

> 没入感を壊さず、興味を持った星を知れる。

候補:

- 星座線
- 星座名
- 星名
- 星／星座／天体検索
- 星タップ／クリック
- 軽い基本情報
- 豆知識
- 惑星／月／代表的天体(Scope に含めるかは Small Spec で未決定)

### 4次 — 癒し体験の強化(Done)

Small Spec: `docs/features/phase-4-relaxation.md` / タスク分割: `docs/features/phase-4-implementation-tasks.md`

目的:

> 星空を自分好みのリラックス空間にできる。

候補:

- 内蔵 BGM
- 環境音
- 音量／ミュート
- 音楽ファイル読み込み
- プレイリスト
- リピート／シャッフル
- Planetarium-like / Natural などの表現プリセット
- 背景プリセット
- 天の川
- 地平線／風景
- スリープタイマー
- 自動 UI 非表示
- フェードアウト
- プロジェクター表示プリセット

### 5次 — 表示体験の整理(Small Spec 作成予定)

目的:

> 星空そのものに集中しやすい、静かな表示体験を整える。

候補:

- 鑑賞モード
- UI 自動非表示
- Planetarium-like / Natural などの軽い表現プリセット
- プロジェクター向け表示補正
- 情報ラベルやオーバーレイの静音化

### 6次 — 保存・出力

目的:

> 気に入った星空体験を再利用・保存できる。

候補:

- お気に入り地点
- お気に入りシーン
- 設定プリセット
- 最近使った場所
- 最後の状態から再開
- スクリーンショット
- 再生動画保存
- シーン共有

### 7次 — 惑星・月・主要天体の表示(Done)

目的:

> 恒星中心の星空に、肉眼で分かる主要天体を静かに追加する。

候補:

- 惑星の位置表示
- 月の位置表示
- 主要天体の最低限の見え方調整
- 恒星と主要天体の描画責務分離
- 既存の検索・選択導線への統合

### 8次 — 認証・DB保存(後回し)

候補:

- Better Auth
- ローカル PostgreSQL
- サインイン / サインアウト / セッション復元
- DB保存による前回状態の復元

### 9次 — 保存体験の拡張(後回し)

候補:

- お気に入りシーン複数保存
- 保存一覧
- 最近使った場所
- 最小の保存管理 UI

### 10次 — 雰囲気プリセット / 表現設定(Done)

Small Spec: `docs/features/phase-10-atmosphere-presets.md` / タスク分割: `docs/features/phase-10-implementation-tasks.md`

目的:

> 雰囲気の異なる夜空体験を、静けさを保ったまま切り替えて楽しめるようにする。

結果: 表現プリセットは差分が小さく廃止し、単一のプラネタリウム基準に固定。夜間向け表示は独立の `Night Mode UI` として追加し、最小の設定パネル(`SettingsOverlay`)にまとめた。プロジェクター投影時のブラウザ chrome 対策も追加(D030, D031)。

### 11次 — 音楽 / リラクゼーション拡張(13次より後回し, D032)

候補:

- 内蔵 BGM
- 環境音
- 音量 / ミュート
- スリープ用途の補助

### 12次 — 同期 / 共有(未確定)

候補:

- 複数端末同期
- 共有リンク
- シーン共有
- 競合解決

必要になった時点で再検討する。

### 13次 — 天文拡張機能(Done, D032)

Small Spec: `docs/features/phase-13-constellation-art.md` / タスク分割: `docs/features/phase-13-implementation-tasks.md`

目的:

> 他アプリにある天文拡張機能のうち、Product Principle と矛盾しないものだけを選んで追加する。

D032 により、Phase 10 Task 4 で棚卸しした 6 候補のうち **星座絵表示のみ** をスコープとする。残りは既存 Decision(D014, D017)や Product Principle 2 と矛盾するか独立したスコープ確定が必要なため対象外(衛星・イベント・観測支援・AR/センサー・星座線常時表示化・ラベル量調整・地平線/グリッド/方位表示)。

## Settings Evolution

設定画面の具体的な位置（下／横など）は今は決めない。

基本原則:

- 星空と同じ画面上にオーバーレイ
- 閉じればすぐ星空だけに戻れる
- 設定対象となる機能と同じフェーズで設定項目を追加
- 最初から巨大な設定画面を作らない

想定カテゴリ:

- 表示
- 星空
- 時間
- 場所
- サウンド
- パフォーマンス
- プロジェクター
- 言語
- アカウント
- プライバシー
- ライセンス／出典

## Technology Selection Timing

技術をすべて初期段階で固定しない。

### 今決める

- Web フロントエンド基盤
- 星空描画方式
- 言語
- 0次のテスト／品質基盤
- コード責務の基本分離
- Visual Target を要件として扱う方針

### 必要なフェーズで決める

- 実星データソース
- 天文計算ライブラリ
- 都市検索／ジオコーディング
- ホスティング
- API / backend
- DB
- 認証
- 課金
- ファイル保存先
- 動画エンコード
- Analytics / monitoring

選定時の評価軸:

1. Product Principles との相性
2. 商用利用可能性
3. スマホ利用との相性
4. 将来の拡張性
5. 実装速度
6. セキュリティ運用のしやすさ
