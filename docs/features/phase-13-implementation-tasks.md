# Phase 13 — 天文拡張機能(星座絵表示) — Implementation Tasks

13次開発として、星座選択時に星座絵(神話上の人物・動物のシルエット)を重ねて表示する機能を追加するためのタスク分割。

## 前提

- Phase 10 Task 4 で棚卸しした 6 候補のうち、星座絵表示のみを 13次のスコープとする(D032)
- 11次(音楽/リラクゼーション拡張)より先に着手する(D032)
- Small Spec: `docs/features/phase-13-constellation-art.md`

## Task List

### Task 1 — 13次スコープ確定

Status: Done

結果(D032): 13次は 11次より先に着手し、スコープは星座絵表示のみとする。残り 5 候補(星座線常時表示化・ラベル量調整・地平線/グリッド/方位表示・AR/センサー系・イベント/衛星/観測支援)は既存 Decision(D014, D017)や Product Principle 2 と矛盾するか独立したスコープ確定が必要なため対象外。`docs/features/phase-13-constellation-art.md` を Small Spec として新規作成し、`PRODUCT.md` / `DEVELOPMENT.md` / `docs/TASKS.md` の Current Phase を更新した。

完了確認:

- [x] 13次の Small Spec が作成されている
- [x] 13次でやること / やらないことが明確

### Task 2 — 星座絵アセットの選定・ライセンス確認

Status: Done

結果(D033): Stellarium 標準星座絵(Johan Meuris 作、[stellarium-skycultures](https://github.com/Stellarium/stellarium-skycultures) `western`)を採用。Free Art License(商用利用可、改変版配布時は同ライセンス継承 + クレジット必須)。形式は配布されている WebP 画像をそのまま使用し、画像ごとのアンカーデータ(ピクセル座標⇔Hipparcos 星番号)を Astraloom の HYG ベースの星カタログへ座標近傍マッチングで位置合わせする方針(d3-celestial 統合と同じ手法)。詳細は `docs/features/phase-13-constellation-art.md` の Technical Direction と `DECISIONS.md` D033 を参照。

完了確認:

- [x] アセットの入手元とライセンスが人間確認済み
- [x] 採用形式と位置合わせ方針が決まっている

### Task 3 — 表示条件・統合設計

Status: Done

結果: 星座絵は星座線・星座名と完全に同じ条件(`Starfield.tsx` の `refreshConstellationDisplay`/`clearSelection` 経路)で表示・非表示する。独立トグルは追加しない。Placement/Appearance/Renderer の責務分離を既存の `ConstellationRecord` 構造に沿って設計し、型定義を `src/constellations/constellationArtTypes.ts` に新規作成した(実データ・投影関数・renderer 統合は Task 4 で追加)。旧 Argo Navis のように1画像が複数 `ConstellationRecord` にまたがるケースは `constellationIds` 配列で対応し、画像は分割せず共有する方針とした。クレジット表記は README.md の既存「Data Attribution」節に追加する方針とし、実際の追記は Task 4 で行う。詳細は `docs/features/phase-13-constellation-art.md` の「Task 3 結果」を参照。

完了確認:

- [x] 表示タイミングと統合方針が決まっている
- [x] 既存の星座線描画構造と責務が衝突しない設計になっている

### Task 4 — 星座絵の描画実装

Status: In Progress(絵柄の方向性が未確定。描画の実装は2回却下されて撤去済み — 次セッションは人間との方向性合意から再開すること)

**残っている土台(コミット前、作業ツリーに存在)**: 型定義 `constellationArtTypes.ts`(`ConstellationArtRecord`/`ConstellationArtAnchor`/`ConstellationArtPlacement` — 画像アンカー ⇔ HYG 星ID の対応だけを持つ、描画方式に依存しない部分)、配置計算 `constellationArtProjection.ts`(星座線と同じ地平座標パイプラインでアンカーを球面へ投影、地平線下のアンカー除外、有効アンカー2点未満で非表示)、遅延読み込み `constellationArtCatalogSource.ts`(`data/constellationArt.json` を `import()` で遅延ロード)。カタログデータは中身なしの `[]` プレースホルダー。StarfieldRenderer/Starfield.tsx への描画統合は行っていない(過去に統合していたコードは撤去済み)。

**アセット生成進捗**: 線あり版を日本語名の五十音順で88件生成・配置済み。完了: アンドロメダ座、いっかくじゅう座、いて座、いるか座、インディアン座、うお座、うさぎ座、うしかい座、うみへび座、エリダヌス座、おうし座、おおいぬ座、おおかみ座、おおぐま座、おとめ座、おひつじ座、オリオン座、がか座、カシオペヤ座、かじき座、かに座、かみのけ座、カメレオン座、からす座、かんむり座、きょしちょう座、ぎょしゃ座、きりん座、くじゃく座、くじら座、ケフェウス座、ケンタウルス座、けんびきょう座、こいぬ座、こうま座、こぎつね座、こぐま座、こじし座、コップ座、こと座、コンパス座、さいだん座、さそり座、さんかく座、しし座、じょうぎ座、たて座、ちょうこくぐ座、ちょうこくしつ座、つる座、テーブルさん座、てんびん座、とかげ座、とけい座、とびうお座、とも座、はえ座、はくちょう座、はちぶんぎ座、はと座、ふうちょう座、ふたご座、ペガスス座、へびつかい座、へび座、ヘルクレス座、ペルセウス座、ぼうえんきょう座、ほうおう座、ポンプ座、ほ座、みずがめ座、みずへび座、みなみじゅうじ座、みなみのうお座、みなみのかんむり座、みなみのさんかく座、やぎ座、やまねこ座、や座、らしんばん座、りゅうこつ座、りゅう座、りょうけん座、レチクル座、ろくぶんぎ座、ろ座、わし座。残り: 0件。各ファイルは `public/with_line/<星座名>_線あり.png`。線なし版の作成と実アプリへの統合は未着手。レビュー用一覧: `tmp/constellation-with-line-review.html`。

**これまでに却下された描画方式(2回、いずれもコード撤去済み)**:

1. Stellarium `western` sky culture の絵をそのままテクスチャ表示 → 「がっつり画像すぎる」で却下。
2. シルエット輪郭線の自動抽出(marching squares + Chaikin smoothing、`constellationArtOutline.ts` + `scripts/build-constellation-art-catalog.mjs`)→ グリッド解像度とスムージングを変えた4案を比較([Artifact: 星座絵アウトライン比較](https://claude.ai/code/artifact/8edcda51-1ed8-452d-ac4f-7b6d0d856db7))→ グリッド40+平滑化案を選んで実装・さそり座で確認 → 「なんか弱い」で再却下。体のパーツを描き分けた線は元のStellarium絵(陰影のグラデーション塗りで線画ではない)から自動抽出できないと判明。ペン線(陰影の濃淡)を直接抽出する方式も試したがノイズだらけで不採用。
   - この方式のコード(`constellationArtOutline.ts` とそのテスト、`scripts/build-constellation-art-catalog.mjs`、`StarfieldRenderer`/`Starfield.tsx`/`starfieldConfig.ts` への統合、`constellationArt.json` の実データ)は撤去済み。型定義から `outlineSegments` も削除した(人間の指示による差し戻し)。

**その後に検討して却下された案(コード化はしていない、方向性確認のみ)**:

- 実星の並びを使った「線」バリエーション3案(現行ベースライン/H.A. Rey伝統様式/オリジナル手描きカーブ)を さそり座で比較([Artifact: Scorpius Line Study](https://claude.ai/code/artifact/34c636dd-66d5-4abc-9e57-c954cf6e692c))→ そもそも「星座線」の話であって「星座イラスト(生き物の絵)」の話ではないと指摘され、作り直し。
- 生き物としてのイラスト2案(詳細版/ミニマル版)を さそり座で試作([Artifact: Scorpius Illustration Study](https://claude.ai/code/artifact/526a21ff-d1d3-49f9-8e9f-cf5ccff28fdd))→ 密度感(詳細版)は近いが「絵がダメすぎる」で却下。Claude の手描きSVGには品質上の限界があることを確認。
- 他社サービス調査: PIXTA([139785914](https://pixta.jp/photo/139785914) ¥550、解剖学的に詳細すぎて却下 / [137934699](https://pixta.jp/photo/137934699) 記号的すぎて却下)、iStock/Dreamstime等の海外ストック、Creative Market の「88 constellations」系素材(Megs Lang $48、TheSlavicRoots $24)、Etsy の88星座バンドル、チコデザの無料素材 — いずれも「ただの星結び線」か「描き込みすぎ」の両極端で、「線中心・関節は分けて描く・描き込みすぎない」という中間の絵柄の既製品は見つからず。
- 参考画像の出所(illust-factory.com、株式会社アット運営)を直接確認: これはクライアントが発注した過去の制作実績(プラネタリウム用途で星座イラストを受注した事例)であり、無断利用不可。ただし同社は「1点2,200円〜」のカスタムイラスト制作サービスで、まさに同じ用途(プラネタリウムで星座の形がわかるイラスト)の実績があるため、88星座分をカスタム発注する候補にはなり得る(実際の見積もりは未取得)。

**現在の方向性(人間の判断待ち、次セッションで再開)**:

人間が別のAI画像生成ツールで星座絵を生成し、Claude 側はその画像を実際の星の位置へアンカー配置する実装を担当する案を検討中。技術的には可能(`constellationArtProjection.ts` のアンカー投影を流用でき、`constellationArtOutline.ts` が使っていたgnomonic接平面フィット — 3アンカーでアフィン変換・2アンカーで相似変換 — を画像プレーンの角に適用する形で作り直せば良い)。ただし以下が未確定:

- 画像上のピクセル座標 ⇔ 実在の星、のアンカー点をどう決めるか(人手指定が必要)
- AIが実際の星の並びの比率(例: さそり座は鋏がコンパクトで尾が長い)を無視して描くと、アンカー2〜3点だけで実星位置に合わせた時に絵が不自然に伸縮する可能性がある — 実星の骨格図を生成AIへの参考画像として渡すことを提案中

完了確認:

- [ ] 星座選択時に星座絵が表示される(未着手 — 描画方式は撤去済み、土台のみ残存)
- [ ] 見た目が Human Check を通過している(2回却下、AI生成画像+アンカー配置の方向性を検討中)

### Task 5 — 自動検証と Human Check

Status: Not Started

- typecheck / lint / unit test / production build を通す
- Small Spec の Acceptance Criteria(Human Check 観点)を確認してもらう

完了確認:

- [ ] 自動検証がすべて成功している
- [ ] Human Check で問題なしと確認されている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
