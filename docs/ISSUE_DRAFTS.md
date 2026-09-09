# フェーズ別 GitHub Issue 下書き

Phase 1〜13 を、各1件の GitHub Issue として登録した記録。各 Issue の本文はこの文書の下書きを元にしている。

共通ラベル候補: `phase-N`, `completed` / `planned` / `replanned`, `frontend`, `webgl`, `mobile`。

## 作成した Issue

- [Phase 1](https://github.com/miyaabo/Astraloom/issues/2) — 完了としてクローズ
- [Phase 2](https://github.com/miyaabo/Astraloom/issues/3) — 完了としてクローズ
- [Phase 3](https://github.com/miyaabo/Astraloom/issues/4) — 完了としてクローズ
- [Phase 4](https://github.com/miyaabo/Astraloom/issues/5) — 完了としてクローズ
- [Phase 5](https://github.com/miyaabo/Astraloom/issues/6) — 完了としてクローズ
- [Phase 6](https://github.com/miyaabo/Astraloom/issues/7) — 完了としてクローズ
- [Phase 7](https://github.com/miyaabo/Astraloom/issues/8) — 完了としてクローズ
- [Phase 8](https://github.com/miyaabo/Astraloom/issues/9) — オープン
- [Phase 9](https://github.com/miyaabo/Astraloom/issues/10) — オープン
- [Phase 10](https://github.com/miyaabo/Astraloom/issues/11) — 完了としてクローズ
- [Phase 11](https://github.com/miyaabo/Astraloom/issues/12) — オープン
- [Phase 12](https://github.com/miyaabo/Astraloom/issues/13) — オープン
- [Phase 13](https://github.com/miyaabo/Astraloom/issues/14) — 完了としてクローズ

---

## Phase 1 — 実際の星空を再現する

**状態:** 完了

**目的:** 仮の星配置を、指定日時・場所の実データに基づく夜空へ置き換える。

**実施内容:** HYG 星カタログの商用利用条件確認と導入、赤道座標から地平座標への変換、日時・場所・タイムゾーンの最小 UI、実データを描画へ接続した。星の見た目の shader / 表現品質は維持した。

**完了確認:** 型検査・lint・unit test・build・ブラウザ確認、および Human Check を完了。

**問題点・残課題:** 天の川、月・惑星、再生、視点操作は次フェーズへ分離した。

**参照:** `docs/features/phase-1-real-sky.md`、`docs/features/phase-1-implementation-tasks.md`

---

## Phase 2 — 時間再生と視点操作を追加する

**状態:** 完了

**目的:** 実際の星の動きを、時間を流しながら静かに眺められるようにする。

**実施内容:** 球面表示と `PerspectiveCamera` への移行、ドラッグによる視点移動・ズーム、再生／停止／速度変更／巻き戻し、再生中の計算頻度制御、日時・場所・再生オーバーレイの整理を実施した。

**完了確認:** 自動検証と PC／スマホの Human Check を完了。

**問題点・残課題:** 開始・終了時刻を指定する高度な時間範囲 UI、スリープタイマー、自動停止、終了時フェードは未実装。宇宙空間を移動する体験は本フェーズの観測地点から空を見る操作とは別機能として扱う。

**参照:** `docs/features/phase-2-playback.md`、`docs/features/phase-2-implementation-tasks.md`、`DECISIONS.md` D014

---

## Phase 3 — 星・星座を知る導線を追加する

**状態:** 完了

**目的:** 没入感を壊さず、興味を持った星や星座の軽い情報に触れられるようにする。

**実施内容:** 星座線・星座名・星名のデータ導入と球面描画、タップ／クリック選択、基本情報表示、星・星座検索、豆知識、「次の星座」導線を追加した。情報は選択時のみ表示する方針にした。

**完了確認:** 自動検証を完了。

**問題点・残課題:** 星座線の常時表示、ラベル量調整、詳細な学術情報、観測支援表示は対象外。常時表示化は Calm by Default と衝突するため、別途仕様決定が必要。

**参照:** `docs/features/phase-3-star-knowledge.md`、`docs/features/phase-3-implementation-tasks.md`、`DECISIONS.md` D015〜D017

---

## Phase 4 — 天の川と地平線／風景を追加する

**状態:** 完了

**目的:** 星空に奥行きと自然な景観を加え、鑑賞体験を強くする。

**実施内容:** 既存 shader を拡張し、天の川の配置・描画・見た目調整、地平線／風景の配置・描画・見た目調整を実施した。ドラッグ、ズーム、再生との組み合わせを確認した。

**完了確認:** コードレビュー、自動検証、PC／スマホでの Human Check を完了。

**問題点・残課題:** BGM、環境音、スリープ支援は実装していない。観測支援のグリッドや方位表示は本フェーズの景観表現とは別扱い。

**参照:** `docs/features/phase-4-relaxation.md`、`docs/features/phase-4-implementation-tasks.md`、`DECISIONS.md` D018

---

## Phase 5 — 鑑賞に集中できる表示体験を整える

**状態:** 完了

**目的:** 操作 UI が星空鑑賞を邪魔しない表示体験を整える。

**実施内容:** 表示状態モデルを整理し、鑑賞モード、標準モードでの UI 自動非表示と再表示、表現プリセット、プロジェクター向け表示補正を追加した。

**完了確認:** コードレビュー・自動検証・Human Check を完了。

**問題点・残課題:** 表現プリセットは後に Phase 10 の Human Check で廃止した。設定項目の増加に伴う画面構成・設定導線の再整理は別 Issue 候補。

**参照:** `docs/features/phase-5-display-experience.md`、`docs/features/phase-5-implementation-tasks.md`、`DECISIONS.md` D019

---

## Phase 6 — 保存と再開を追加する

**状態:** 完了

**目的:** 気に入った星空を保存し、次回も自然に再開できるようにする。

**実施内容:** 保存対象を「星空を再現する状態」に限定し、version 付きの保存モデル、localStorage への最小保存、お気に入りシーン、前回状態の復元、破損データ時の安全なフォールバックを実装した。

**完了確認:** コードレビュー・自動検証・Human Check を完了。

**問題点・残課題:** 複数保存の一覧・編集・削除、最近使った場所、共有リンク、スクリーンショット、動画保存、サーバー保存は未実装。これらは Phase 9／12 の候補。

**参照:** `docs/features/phase-6-save-and-resume.md`、`docs/features/phase-6-implementation-tasks.md`、`DECISIONS.md` D020

---

## Phase 7 — 月・惑星・主要天体を表示する

**状態:** 完了

**目的:** 恒星中心の夜空に、肉眼で分かる主要天体を自然に追加する。

**実施内容:** Astronomy Engine adapter、月・水星・金星・火星・木星・土星の位置計算、描画データ変換と描画レイヤー、検索、選択、軽い情報表示を追加した。恒星系と主要天体系の責務を分離した。

**完了確認:** コードレビュー・自動検証・Human Check を完了。

**問題点・残課題:** 小惑星・彗星・人工衛星、詳細な天体情報、観測支援、イベント通知は対象外。

**参照:** `docs/features/phase-7-celestial-bodies.md`、`docs/features/phase-7-implementation-tasks.md`、`DECISIONS.md` D022

---

## Phase 8 — 認証・DB 保存を現行方針で再計画する

**状態:** 計画中／再計画が必要

**目的:** ログインと将来の DB 保存へ安全に接続する最小基盤を作る。

**実施済み内容:** 旧 Supabase 前提の認証・同期実装は一度作成したが、方針変更により削除した。認証方式を email + password、基盤を Better Auth + ローカル PostgreSQL に決定した。

**残作業:** 現行方針に合わせて state／repository 境界、サインイン・サインアウト・セッション復元、DB 保存の最小範囲、セキュリティレビュー、自動検証を作り直す。

**問題点・課題:** 既存の実装タスクには旧 Supabase の実施記録が混在している。実装開始前に Small Spec とタスクを現行方針へ更新する必要がある。未ログイン時のローカル利用を壊さないことが必須。

**参照:** `docs/features/phase-8-account-sync.md`、`docs/features/phase-8-implementation-tasks.md`、`DECISIONS.md` D026・D027

---

## Phase 9 — 保存体験を拡張する

**状態:** 未着手

**目的:** 保存した星空を、鑑賞を妨げずに管理・再利用できるようにする。

**予定内容:** 複数のお気に入りシーン、保存一覧、最近使った場所、最小の保存管理 UI。

**問題点・課題:** Small Spec と詳細タスクがまだない。保存件数、編集・削除、既存 localStorage との互換性、後続のクラウド同期との関係を先に決める必要がある。

**参照:** `DEVELOPMENT.md` — Phase 9、`PRODUCT.md` — Save / Share

---

## Phase 10 — 夜間・プロジェクター向けの表示設定を整える

**状態:** 完了

**目的:** 静けさを保ちながら、利用環境に合う表示設定を提供する。

**実施内容:** 表示設定の棚卸し、他アプリの表示切替候補の整理、Night Mode UI、プロジェクター補正・夜間 UI・フルスクリーンをまとめる最小 `SettingsOverlay`、iOS PWA 向け設定、アドレスバー自動収縮を実装した。Human Check を踏まえ、差分の弱い表現プリセットは廃止し、単一のプラネタリウム基準へ固定した。

**完了確認:** 自動検証・Human Check を完了。

**問題点・残課題:** iOS の Safari 以外では browser chrome を完全に除去できない。設定項目が増えた際の設定画面・画面構成の再設計は未着手。

**参照:** `docs/features/phase-10-atmosphere-presets.md`、`docs/features/phase-10-implementation-tasks.md`、`DECISIONS.md` D030・D031

---

## Phase 11 — 音楽／リラクゼーション体験を拡張する

**状態:** 未着手（13次より後回し）

**目的:** 就寝前の星空鑑賞を補助する音とスリープ体験を追加する。

**予定内容:** 内蔵 BGM、環境音、音量／ミュート、スリープ用途の補助。

**問題点・課題:** Small Spec と詳細タスクがない。音源ライセンス、モバイルの自動再生制約、終了時の挙動、保存対象を決める必要がある。ユーザー音楽ファイル読み込みは、形式・サイズ・検証・Object URL の安全設計を別途必要とする。

**参照:** `DEVELOPMENT.md` — Phase 11、`PRODUCT.md` — Sound / Relaxation

---

## Phase 12 — 同期・共有を検討する

**状態:** 候補／未着手

**目的:** 保存した星空体験を複数端末で再利用、または共有できるようにする。

**予定内容:** 複数端末同期、共有リンク、シーン共有、競合解決。

**問題点・課題:** Phase 8 の認証・DB 保存が前提。共有範囲、位置情報などのプライバシー、リンク失効・削除、競合解決、認可を先に仕様化する必要がある。

**参照:** `DEVELOPMENT.md` — Phase 12、`PRODUCT.md` — Save / Share

---

## Phase 13 — 星座絵表示を追加する

**状態:** 完了

**目的:** 選択した星座にだけ、星座線・名称と同期する控えめな星座絵を重ねる。

**実施内容:** 星座絵アセットのライセンス確認、表示条件・アンカー配置設計、89エントリの線なしイラスト、球面上への剛体配置、選択時のみの表示、テクスチャ遅延読み込みとキャッシュを実装した。

**完了確認:** 自動検証と Human Check を完了。

**問題点・残課題:** 星座絵の常時表示や独立トグルは追加しない。ラベル量調整、方位／グリッド、AR／センサー、衛星・イベントなどは別の目的・仕様が必要。

**参照:** `docs/features/phase-13-constellation-art.md`、`docs/features/phase-13-implementation-tasks.md`、`DECISIONS.md` D032・D033
