# Phase 13 — 星座絵表示 — Small Spec

## Status

Task 1(スコープ確定)・Task 2(アセット選定・ライセンス確認)・Task 3(表示条件・統合設計)完了。`DECISIONS.md` D032・D033 を参照。

## Visual Artwork Direction

For any AI-generated constellation image, read and follow
`docs/references/constellation-art-direction.md`. It defines the approved style,
reference geometry, and the required relationship between with-line and no-line
asset pairs.

## Goal

星座を選択したとき、既存の星座線・星座名に加えて、星座の絵柄(神話上の人物・動物などのシルエット/イラスト)を控えめに重ねて表示できるようにする。Product Principle 1(Planetarium-like First)・Principle 5(Calm by Default)を維持したまま、既存のプラネタリウムアプリにある「星座絵」表現を Veluna にも持ち込む。

## Background / Reference

- 星座線・星座名は 3次(`docs/features/phase-3-star-knowledge.md`)で実装済み。d3-celestial データセット(D015)を元に、星を選択したときだけ星座線・名前・豆知識を表示する Calm by Default(D017)の枠組みがある
- 星座絵はこの枠組みの延長として、選択時のみ・既存の星座線と同じタイミングで表示する追加レイヤーと位置付ける
- 他のプラネタリウムアプリ(Stellarium 等)では、星座線に加えて神話上の人物・動物の絵柄を薄く重ねる「Constellation Art」表示が一般的

## Scope(D032)

- 星座を選択した際、星座線・星座名と同じタイミングで星座絵を重ねて表示する
- 星座絵は既存の d3-celestial 由来の星座線・星座座標に位置合わせする
- 表示の濃さ・色は Planetarium-like First を壊さない範囲に抑える(強い色・輪郭を避ける)

## Out of Scope(13次では扱わない)

- 星座線の常時表示化(D017 の Calm by Default を維持。選択時のみ表示のまま)
- ラベル量調整、地平線/グリッド/方位表示、AR/センサー系、イベント/衛星/観測支援(D032 により対象外。理由は `DECISIONS.md` D032 参照)
- 星座絵の表示 ON/OFF をユーザーが選べる設定 UI(まずは星座線と同じ挙動に統合し、独立トグルが必要かは Human Check 後に判断)

## Technical Direction

- 星座絵アセットは Stellarium 標準星座絵(Johan Meuris 作、Free Art License)を採用する(D033)。配布形式は WebP 画像をそのまま使用し、画像ごとのアンカーデータ(ピクセル座標⇔Hipparcos 星番号)を Astraloom の星カタログへ座標近傍マッチングで位置合わせする
- 既存の `ConstellationRecord`(`src/constellations/constellationTypes.ts`)・投影ロジック(`constellationProjection.ts`)・renderer 統合(`StarfieldRenderer` の `showConstellationLines`)と同じ設計方針(Placement / Appearance / Renderer の分離)を踏襲する

### Task 3 結果 — 表示条件・統合設計

- **表示タイミング**: 星座線・星座名と完全に同じ条件に統合する。`Starfield.tsx` の `refreshConstellationDisplay`(タップ選択・検索選択・「次の星座」ボタンが共通で通る経路)で表示し、`clearSelection` で非表示にする。日時/場所変更時の再計算も同じ関数内で行う(星座線がずれた既知の問題と同じ理由)。星座絵専用の独立 ON/OFF トグルは追加しない(Small Spec の判断を維持)。
- **責務分離**(`ConstellationRecord` まわりの既存分離を踏襲):
  - Star source/data: ビルド時生成データ `src/constellations/data/constellationArt.json`(Task 4 で `scripts/build-constellation-art-catalog.mjs` により生成。Hipparcos 番号→HYG 星 ID の変換はビルド時に完了させ、実行時コードは HYG id のみを扱う)
  - 型定義: `src/constellations/constellationArtTypes.ts`(新規作成済み)に `ConstellationArtRecord` / `ConstellationArtAnchor` / `ConstellationArtPlacement` を定義。`ConstellationRecord` と対をなす構造
  - Placement: `src/constellations/constellationArtProjection.ts`(Task 4 で新規作成)に、`constellationProjection.ts` と同じ赤道座標→地平座標→球面のパイプラインでアンカーを投影する関数を追加する。地平線下のアンカーは除外し、有効なアンカーが2点未満なら非表示とする
  - Appearance: 濃さ・色は `starfieldConfig.ts` の `render.constellationLines` と同じ場所に `render.constellationArt` として追加し(Task 4)、Planetarium-like First を壊さない低 opacity・無彩色を初期値にする
  - Renderer: `StarfieldRenderer` に `constellationLines` と対になる非表示状態のレイヤーを追加し、`showConstellationArt(placement)` / `hideConstellationArt()` を `showConstellationLines`/`hideConstellationLines` と対の API として Task 4 で実装する。テクスチャは選択時に遅延ロード+キャッシュし、起動時に全画像を読み込まない(Performance Rules)
- **1つの星座絵が複数 `ConstellationRecord` にまたがるケース**(旧 Argo Navis 由来の Carina/Puppis/Vela/Pyxis 等): `ConstellationArtRecord.constellationIds` に複数 id を持たせ、選択された星座がそのいずれかに一致すれば同じ画像をそのまま(分割せず)表示する。星座線は既存どおり選択された1レコード分のみ表示し、D017 は変更しない。Stellarium 本家も同じ画像を共有する挙動のため踏襲する
- **クレジット表記**(Free Art License の要件): アプリ内 UI には追加せず、README.md の既存「Data Attribution」節(HYG・d3-celestial と同じ場所)に一文を追加する方針とする。Calm by Default を優先し、既存の他データ出典表記と扱いを揃える。実際の追記はアセットを取り込む Task 4 で行う

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- console error なし

### Human Check

- 星座絵が Planetarium-like First(D011)から外れていない(派手すぎない、輪郭が強すぎない)
- 星座線・星座名との併用時に情報過多に見えない(Calm by Default, Principle 5)
- PC・スマホ縦画面で破綻しない

## Questions Claude May Ask

Task 1 で以下は人間確認のうえ確定済み(D032)。

- ~~13次は何を扱うか~~ → 星座絵表示のみ。他 5 候補は対象外
- ~~11次と13次どちらを先にやるか~~ → 13次を先に着手

Task 2 で以下は人間確認のうえ確定済み(D033)。

- ~~星座絵アセットの入手元~~ → Stellarium 標準星座絵(Johan Meuris 作)
- ~~ライセンス条件~~ → Free Art License(商用利用可、改変版配布時は同ライセンス継承 + クレジット必須)
