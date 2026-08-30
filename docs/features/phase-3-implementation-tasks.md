# Phase 3 — Implementation Tasks

3次開発(`docs/features/phase-3-star-knowledge.md`)を実装するためのタスク分割。
セッションをまたいで進めるための作業単位であり、Feature Spec 自体の代わりにはならない。

## 新しいセッションで最初に読むもの

1. `PRODUCT.md`
2. `CLAUDE.md`
3. `DEVELOPMENT.md`
4. `docs/features/phase-3-star-knowledge.md`
5. `docs/features/phase-2-playback.md`(2次の前提、Done)
6. `docs/features/phase-1-real-sky.md`(1次の前提、Done)
7. `DECISIONS.md`
8. このファイル(現在の進捗確認)
9. 既存コード(`src/stars/`, `src/astronomy/`, `src/render/`, `src/Starfield.tsx`)

その後、下記タスクのうち **最初に Status が `Done` でないもの** から着手する。

## 進め方のルール

- 1 タスクずつ実装する。複数タスクをまとめて一気に進めない。
- 各タスク完了時に「完了確認」の内容を満たしているか自己検証する。
- タスク完了後、実装結果と検証結果を報告し、次のタスクへ進んでよいか人間の確認を待つ(自動で連続実行しない)。
- Out of Scope(`phase-3-star-knowledge.md` 参照)には手を出さない。
- 星の「見た目」(shader・starVisualAttributes・config)・位置計算(`skyProjection.ts`, `coordinates.ts`)・カメラ/再生エンジン(`cameraControls.ts`, `src/playback/`)は 0次〜2次の資産をそのまま使う。星座線・星座名・星情報・検索の追加に専念する。
- 実装方法の細部で判断に迷っても、Product Guardrails に触れない限り質問せず合理的に進めてよい。仮定は完了報告に書く。
- Task 1(データソース選定・スコープ確定)は商用利用条件と Scope 判断を含むため、必ず人間確認のうえで先へ進む。

## Task List

### Task 1 — 星座データソース選定 + スコープ確定

Status: Done

- 星座線(頂点ペア)・星座名データの候補として d3-celestial(Olaf Frohn, BSD-3-Clause)と Stellarium `constellationship.fab`(GPLv2+、星座線定義のみ GitHub Discussion 上で MIT 再ライセンス許諾)を比較し、商用利用条件の明確さを優先して d3-celestial を採用(D015)
- 惑星・月・代表的天体を 3次 Scope に含めるか、星座線の見た目方針(常時表示か選択時のみか)を人間へ提案し、いずれも推奨案(対象外のまま/選択時のみ表示)で確定(D016, D017)
- 決定事項を `DECISIONS.md`(D015〜D017)・`PRODUCT.md`・`phase-3-star-knowledge.md` へ反映済み

完了確認:
- 採用データソースが決定し、`DECISIONS.md` に記録されている → 済(D015)
- ライセンス上、Veluna の将来の商用利用を妨げないことを確認済み → 済(BSD-3-Clause、商用利用明示的に可)
- 3次の最終的な Scope(惑星等を含むか)が確定している → 済(D016、対象外)

### Task 2 — 星座線データの導入・前処理

Status: Done

- d3-celestial の `constellations.lines.json`(星座線, RA/Dec の GeoJSON)・`constellations.json`(星座名)を `scripts/build-constellation-catalog.mjs` で前処理し、`src/constellations/data/constellationCatalog.json` を生成
- 各頂点(RA/Dec)は既存の `src/stars/data/hygCatalog.json`(mag≤6.5)の星と大円距離で最近傍マッチングし、星 ID のペア(`segments`)に変換。全 893 頂点が 0.1°以内で一意にマッチし、未マッチは 0 件
- 生ファイル(`constellations.lines.json`/`constellations.json`)は他の raw データと同様 `data/raw/`(gitignore 済み)に置く前提。取得元 URL はスクリプト冒頭コメントに記載
- ロード側は `src/constellations/constellationCatalogSource.ts`(`loadConstellationCatalog`)。`hygCatalogSource.ts` と同じ方針で、bundle されたデータをランタイムでも型・範囲検証する
- 星座は 89 features(IAU 88 星座 + Serpens が Caput/Cauda に分割)。星の固有名との突き合わせは Task 4 のスコープとし、本タスクでは行っていない

完了確認:
- unit test(`constellationCatalogSource.test.ts`)でデータ件数(89 features / 88 unique id)・星座名の非空・頂点参照の整合性(すべて `hygCatalog.json` に存在する星 ID)・自己ループがないことを確認 → 済
- まだ画面描画はしていない → 済(型定義とデータロードのみ)

### Task 3 — 星座線の球面描画

Status: Done

- `src/constellations/constellationProjection.ts`(新規)で、星座の頂点(HYG 星 ID)を既存の `equatorialToHorizontal`(`src/astronomy/coordinates.ts`)・`projectHorizontalToSphere`(`src/stars/skyProjection.ts`)でそのまま球面座標へ投影。星の shader・placement/appearance 分離には手を入れていない
  - 頂点のどちらかが地平線下の場合はそのセグメントを描画対象から除外する(`generateRealStarData` の地平線下カットと同じ考え方)
- `StarfieldRenderer` に `THREE.LineSegments` の星座線レイヤーを追加(`showConstellationLines(segments)` / `hideConstellationLines()`)。D017 に従いデフォルトは非表示
- 線の見た目(色・不透明度)は `starfieldConfig.render.constellationLines`(色 `#8fa8d9`、不透明度 0.35)に集約。太さは `THREE.LineBasicMaterial` の制約上 `linewidth` を使わず、色を控えめにする方針で対応
- Task 5(選択 UI)が未実装のため、選択トリガーの代わりに開発時専用のテストボタン(`src/Starfield.tsx`、`import.meta.env.DEV` ガードで本番ビルドには含まれない)を追加。クリックするとその瞬間見えている星座を1つ選び、線を表示しつつ視点もその方向へ自動で向ける(`StarfieldRenderer.debugSetLookDirection`)。**Task 5 で実際の選択ロジックに置き換える前提の暫定コード**であり正式仕様ではない

完了確認:
- ブラウザで星座線が球面表示上に破綻なく表示される → 済。Playwright と人間の目視の両方で確認(console error なし)。デフォルト状態(何も選択していない状態)では線が一切表示されないことも確認済み
- Human Check(線の主張が強すぎず、星空の落ち着きを壊していないか)→ 済(問題なしとの確認を得た)

### Task 4 — 星座名・星名の表示

Status: Done

- HYG Database の `proper` 列(固有名)がこれまで前処理で捨てられていたため、`scripts/build-hyg-catalog.mjs` を拡張して `properName`(空なら null)を抽出し、`HygStarRecord`(`src/stars/starTypes.ts`)・`hygCatalogSource.ts` の検証・`hygCatalog.json` に反映(mag≤6.5 の 8,920 件中 441 件に固有名あり)
- `src/constellations/constellationProjection.ts` に `computeConstellationStarLabels`(星座内で固有名を持ち、地平線上にある星をラベル化。同じ星が複数セグメントに現れても重複させない)を追加。Task 3 の `averageLookDirection`(Starfield.tsx にあった非公開関数)を `computeConstellationLookDirection` として同モジュールへ移し、星座名ラベルの表示位置(セグメント平均方向を球面座標へ変換)にも再利用
- 星の見た目・位置計算・カメラ本体には手を入れず、画面上の位置だけを新たに扱う `src/render/screenProjection.ts`(`projectToScreen`: 3D 座標をカメラで射影しビューポート内かどうかも判定する純粋関数、unit test あり)を追加し、`StarfieldRenderer` に `setLabelTargets` / `LabelTarget` / `LabelScreenPosition` を実装。毎フレーム(ドリフト・ドラッグ追従)、指定した座標群の画面上位置を算出してコールバックで通知する
- ラベルの識別(テキスト内容)は選択が変わった時だけ更新される React state(`ConstellationLabelsOverlay.tsx`)、位置は毎フレーム ref 経由で直接 DOM に書き込み(`CompassOverlay` と同じパターン)。React の再レンダーをフレーム毎に発生させない
- Task 5(実際のタップ/クリック選択)が未実装のため、Task 3 で追加した開発時専用テストボタンを流用し、表示された星座の名前と、その星座内の固有名付きの星の名前を同時にラベル表示する(Task 5 で本来の選択ロジックに置き換わる暫定挙動)

完了確認:
- 星座名・星名が対応する位置に正しく表示される → 済。ブラウザで開発用ボタンから複数の星座(Aquila: Altair/Tarazed/Alshain/Okab、Auriga: Capella 等、Boötes: Arcturus 等)を確認し、各ラベルが対応する星・星座線の近くに表示されることを確認
- 通常状態では UI が目立たず、星空が主役であることを維持している → 済。星座未選択時はラベルが一切表示されない(D017 と同じ「選択時のみ」方針)。星座名は太字/やや大きめ、星名は控えめなサイズにして階層をつけた
- console error なし(Playwright での自動チェック)、typecheck / lint / unit test(71 件)/ production build 成功

置いた仮定:
- Task 5 未実装のため、「選択」の代わりとして Task 3 のデバッグボタンにラベル表示を統合した(正式な選択 UI は Task 5 で置き換え)

Task 4 完了後、人間から追加のフィードバックを受けて以下を追加対応(Task 4 の一部として実施、Status は Done のまま):
- 表示言語: 星座名・星名ラベルを「英名(日本語名)」形式に統一(例: `Aquila (わし座)`、`Altair (アルタイル)`)。日本語名がないものは英名のみ
  - 星座名の日本語名は d3-celestial の `properties.ja`(D015 で採用済みのデータセットの一部、新規データソースではない)を `nameJa` として `constellationCatalog.json` に追加(`build-constellation-catalog.mjs`)
  - 星の固有名(HYG)には日本語データがないため、有名な星(1等星クラス+主要な伝統的固有名、約110件)のみ `src/stars/starNameJa.ts` にカタカナ表記を手動キュレーション。未収録の星は英名のみ表示(誤った当て字を出さない方を優先)
- ラベルの重なり: `ConstellationLabelsOverlay.tsx` に簡易な衝突回避(`declutter`)を追加。画面上で近接する2つのラベルの矩形が重なる場合、上から順に処理し、後から重なった側だけを縦方向にずらす(横方向にはずらさない = 元の星の位置からのズレを最小限にする)
  - 当初は重なり判定の再計算(`getBoundingClientRect` によるレイアウト読み取り)を200ms間隔で行っていたが、静止時(自動ドリフトのみ)でもラベルが上下に微妙にぶれる不具合を招いた。再計測のたびに生じるサブピクセル単位の測定誤差でズラし幅が数px単位でガクつくのが原因。星座選択が変わるたびに一度だけ計算する方式に変更し解消(以降は視点が動いても再計算しない。大きくドラッグして重なり方が変わるケースは許容する — Task 5 でラベル配置を見直す際に再検討)
- **バグ修正(再生中に線・ラベルが星の動きに追従しない)**: `handleDateChange`/`handleLocationChange` は星(`updateStars`)は再計算していたが、選択中の星座線・ラベルは選択した瞬間の日時の3D座標のまま固定されていた。再生で時間を進めると星は正しく動くのに線・ラベルはほぼ静止して見える不具合だった。選択中の星座を `selectedConstellationRef` で保持し、日時・場所が変わるたびに `refreshConstellationDisplay` で星座線・ラベルを再計算するよう修正(カメラの向きは選択時のみ設定し、日時変更では動かさない)
- **「ラベルだけ常時ドリフトを止める」を試みたが撤回**: 描画用カメラ(揺れを含む)とは別にラベル投影専用の `labelCamera`(揺れを含まない)を追加する実装を一度行ったが、これは「線・星は揺れを含むカメラで描画される」「ラベルは揺れを含まないカメラで位置計算される」という2つの正しい処理を組み合わせた結果、時間経過とともにラベルが実際の星・線の位置から少しずつズレていく不具合を生んだ(「ラベルの位置が変になった」として人間からフィードバックを受け発覚)。ズレは揺れの振幅分(視野角70°・振幅0.012ラジアンで最大 ±8px 程度)蓄積するため、数px単位のガタつきより悪い結果だった。ラベル投影を再度実際の描画カメラ(揺れを含む)に戻し、常時ドリフト自体は素直に許容する方針に確定(位置の正確性 > ラベルだけの静止)。`labelCamera` 関連のコードは撤去済み

### Design Backlog — 見た目の改善提案(未実装)

Task 4 のラベル/星座線の実装を終えた時点で、人間から「他の類似アプリ(Stellarium / Sky Guide / Star Walk 2 等)と比べたデザインの所感」を求められ、以下を提案した。実装はまだしていない。**Task 5(選択 UI を本実装するタイミング)で、ラベル/星座線の見た目にも触れることになるため、そのタイミングでの実装を優先候補とする**。Task 5 で見送る場合は理由を添えてこの節に残す。

背景: Stellarium は観測ツール寄り(高情報密度)で Veluna の「癒し」路線とは方向性が違うため参考にしない。Sky Guide / Star Walk 2 は「癒し・鑑賞」寄りで上品な配色・タイポグラフィを持ち、Veluna の Product Vision に近い。現状(Task 4 時点)のラベル・星座線は機能的だが、0次〜2次で作り込んだ星の輝き・halo・瞬きの視覚言語とまだ繋がっていない。

提案(優先度順):
1. 星座名ラベルにのみ控えめなアクセントカラー(暖色系の淡いゴールドなど)を使い、星名ラベルは白のまま据え置く → サイズ・太さだけでなく色でも階層が分かるようにする
2. 星座線に既存の halo shader の考え方を流用したごく弱いグローを足す → 星の表現(halo/glow)と星座線の視覚言語を統一する
3. ラベルの表示/非表示にフェード(0.2〜0.3秒程度)を入れる → 既存の瞬き(twinkle)と同じ「静かな動き」の言語に揃える

いずれも Product Principle 1(Planetarium-like First)・5(Calm by Default)に沿う方向の変更であり、既存の星座線・星の見た目(shader・starVisualAttributes・config)には手を入れない(Task 5 の Out of Scope 方針を踏襲する)。色・グローの具体的な数値は実装時に Human Check で調整する。

### Task 5 — 星タップ／クリックによる選択と基本情報表示

Status: Done

- `src/render/cameraControls.ts` にタップ/クリック判定を追加(`onTap`)。1本指で押して
  `starfieldConfig.controls.tap.maxMovementPixels`(10px)以内の移動で離した場合のみ
  タップとみなし、ドラッグ・ピンチ・`pointercancel` では発火しない
- ヒットテストは `THREE.Raycaster` ではなく、既存の `projectToScreen`(Task 4)を使った
  スクリーン座標ベースの最近傍探索(`src/render/screenProjection.ts` の
  `findNearestScreenPoint`)で実装。全天の星は同一半径の天球上にあるため、画面座標での
  距離判定は視野角(ズーム)が変わっても一貫した見た目のヒット半径になる。半径は
  `starfieldConfig.controls.tap.hitRadiusPixels`(20px、星の描画サイズより広め)
- `StarData` に `hygId`(元の HYG カタログ ID)を追加(`src/stars/starTypes.ts`,
  `realStarDataSource.ts`)。既存の `id`(配列インデックス、GPU バッファ順と一致)は
  そのまま維持し、タップで当たった星から実データ(等級・色指数・固有名)へ引けるように
  した。`hygCatalogSource.ts` に `findHygStarById`、
  `constellationCatalogSource.ts` に `findConstellationByStarId` を追加
- 選択時の挙動: タップした星に固有名があれば表示、なければ「名前のない星」。
  所属星座があれば Task 3/4 の星座線・星座名/星名ラベル表示をそのまま流用
  (`refreshConstellationDisplay`)。日時/場所変更時の再計算ロジックは変更なし
- 「明るさ・色・所属星座」の表示は生の等級・色指数(観測アプリ的な数値)ではなく、
  `src/stars/starInfo.ts` で「とても明るい/明るい/やや明るい/普通/暗め」「白/青白い/
  オレンジがかった」という言葉に変換(Product Principle 2)
- 新規オーバーレイ `src/StarInfoOverlay.tsx`(D009 の方向性、星空画面下部への
  オーバーレイ)。閉じるボタンで選択解除、背景タップでも解除。既存の
  `PlaybackOverlay` と縦方向に重ならないよう、その帯の高さぶん上に配置
- Task 3/4 の暫定テスト用ボタン(`import.meta.env.DEV` ガード、`debugSetLookDirection`)
  はこの Task 5 の実選択ロジックに置き換わったため削除

完了確認:
- PC のクリック・スマホのタップで意図した星・星座を選択できる → 済
  (Playwright: `e2e/star-selection-smoke.spec.ts`。chromium/mobile-chrome 両方で
  グリッド状にクリックし、星ヒット時の情報パネル表示 → 閉じるボタンでの解除まで確認。
  実際のブラウザでも星座選択(例: Cepheus)を目視確認済み)
- 選択状態を解除すると通常の星空表示に戻る → 済(閉じるボタン、および星以外への
  タップの両方で確認)
- unit test で当たり判定ロジック(スクリーン座標 → 対象星の特定)を確認する → 済
  (`src/render/screenProjection.test.ts` の `findNearestScreenPoint`、
  `src/render/cameraControls.test.ts` のタップ/ドラッグ/ピンチ判定、
  `src/stars/starInfo.test.ts` の表示内容組み立て)
- typecheck / lint / unit test(87件)/ production build / e2e(6件)すべて成功
- console error なし(Playwright での自動チェック)

置いた仮定:
- 星座線そのものへの直接ヒットテスト(線をタップして星座単体を選択)は実装していない。
  星タップで選択した星が星座に属していれば、その星座の線・名前も自動表示する形とし、
  「星タップが主な選択手段」という Task 5 の完了確認文言(「対象星の特定」)に沿う
  最小実装とした。線への直接ヒットテストが必要になった場合は別途仕様化する
- タップ選択時にカメラを対象へ自動で向ける処理は行わない(Task 3 のデバッグ用
  `debugSetLookDirection` は削除)。ユーザーがすでに見ている星をタップする体験のため、
  視点を動かすと「静かな」体験を壊すと判断した
- 固有名のない星を選択した場合の表示名は「名前のない星」で統一した(HYG データに
  バイエル符号等の代替識別子がないため)

Task 5 完了後、人間から追加のフィードバックを受けて以下を追加対応(Task 5 の一部として実施、Status は Done のまま):
- **バグ修正(ズーム時にラベル同士が重なって見える)**: 密集した星座(例: オリオン座の三ツ星 Mintaka/Alnilam/Alnitak)を選択して視野を広げる(ズームアウトする)と、星名ラベルの文字が重なって読めなくなっていた。原因は2つ: (1) `ConstellationLabelsOverlay.tsx` の重なり回避(縦方向のみずらす declutter)は選択が変わった瞬間の1回しか計算しておらず、その後ズームでラベル同士の画面上の距離が変わっても再計算されていなかった、(2) 縦方向にずらす方式だけでは、複数のラベルが極端に近い位置にある場合(密集した星座を広い視野で見たとき等)対応しきれなかった
  - 対応1(ズーム時の再計算): `StarfieldRenderer` にズーム変更を通知する `onZoomChange` コールバックを追加(`zoomBy` 内で発火)。`ConstellationLabelsOverlay` に `resetDeclutter()`(既存の「選択が変わったときのリセット処理」を関数として切り出したもの)を公開し、`Starfield.tsx` がズーム変更のたびにこれを呼ぶことで、その時点の実際の画面配置から再計算されるようにした
  - 対応2(間引き): `StarfieldRenderer.updateLabelPositions()` に、画面上で近すぎる(`LABEL_THINNING_RADIUS_PIXELS`、28px)ラベル同士がある場合、優先度が低い方を非表示にする処理を追加。優先度は `labelTargets` 配列の並び順(星座名が常に最優先、星名は明るい順)で決まり、`Starfield.tsx` 側で星ラベルを等級順にソートしてから渡すよう変更した。DOM 計測(`getBoundingClientRect`)を伴わないパーセント→ピクセル変換のみの軽量な処理のため毎フレーム実行でき、ズームだけでなくドラッグでも常に正しい状態を保つ。ズームで視野が狭くなり間隔が広がれば、間引かれていたラベルは自動的に再表示される
  - 人間の指摘は「画面拡大時」だったが、実際にはズームアウト(視野角を広げてより多くの空を1画面に収める)方向で顕著に発生する現象だった(視野が狭い=ズームインするほど、同じ角距離が画面上でより多くのピクセル間隔になるため)。ズーム方向を問わず両対応(再計算+間引き)は機能するため、原因の呼び方の違いは対応方針に影響しない
  - 検証: ブラウザで密集した星座(オリオン座)をズームアウト/ズームインさせて重なりが解消されることを目視確認(Playwright スクリプトでスクリーンショット取得、console error なし)。既存の自動テスト(typecheck / lint / unit test 87件 / production build / e2e 6件)はすべて成功

### Blocking Issue — 星座線データの簡略化(d3-celestial 由来、要判断)

Task 5 の Human Check で、きりん座について「星の位置・所属としては概ね正しいが、
きりん座全体の見た目としてはかなり簡略化されている」との指摘を受けた。

調査の結果、原因はマッチング処理や前処理スクリプトの不具合ではなく、**採用データソース
(d3-celestial, D015)の元データ自体がきりん座を線分7本(頂点9個)でしか定義していない**
ことを確認済み(`data/raw/d3-celestial-constellations.lines.json` を直接確認し、
`constellationCatalog.json` の線分数と完全一致することを確認)。きりん座は IAU 88 星座
の中でも特に暗く伝統的な図像も薄いため、多くの星図データセットで同様に簡略化されがちな
星座であり、同じ傾向が他の暗い星座(ろくぶんぎ座、はえ座等)にも及んでいる可能性がある。

人間の判断で「現時点では問題」とされたため、Task 6 以降には着手せずここで作業を止めていた。

**解消(人間確認済み)**: 現状(d3-celestial のデータのまま)を許容し、追加のデータソース調査・統合は行わずに Task 6 以降へ進む方針で確定。

### Task 6 — 検索機能

Status: Done

一度人間の指示で実装を丸ごと戻した(理由の詳細は語られていない)が、直後に「検索は残しつつ、
別途『次の星座を表示する』機能も欲しかった」という追加要望を受け、検索機能自体は以下の内容で
再実装して復元した(コミット前だったため、ファイル削除・差分巻き戻しからの再作成で対応)。
「次の星座を表示する」機能は後述の追加対応として実装した。

- `src/search/searchIndex.ts`(新規)に検索ロジックを実装。`loadConstellationCatalog`/`loadHygStarCatalog`(既存)から検索対象一覧(全星座 + 固有名を持つ星のみ)を一度だけ構築し、クエリに対して大文字小文字を無視した単純な部分一致(`String.includes`)でマッチングする。星座は英名+和名(`name`/`nameJa`)、星は`toDisplayStarName`が組み立てる「英名 (和名)」表示文字列に対してマッチさせるため、英語・日本語どちらでも検索できる。固有名のない星は検索対象に含めない(Task 4/5 の「名前のない星」表示方針と同じ)。結果は最大20件
- UI は `src/SearchOverlay.tsx`(新規)。DateTimeOverlay/LocationOverlay と同じ「折りたたみボタン+パネル」パターンだが、その2つ(top-right)と競合しないよう top-left に配置(`overlayStyles.ts` に `overlayPanelStyleLeftAnchored` を追加)。開閉状態は既存の `openOverlay` state に `'search'` を追加する形で統合し、「同時に開くパネルは1つまで」の既存ルールをそのまま踏襲
- 検索結果の選択時の視点移動のため、`StarfieldRenderer` に `lookAt(azimuthDegrees, altitudeDegrees)` を追加(`rotateBy` と同じ `userYawRadians`/`userPitchRadians` を直接設定する形。pitch は既存のドラッグ時と同じ範囲にクランプ)。星選択は `equatorialToHorizontal`(既存)でその星の現在の方向を計算し、星座選択は Task 3/4 の `computeConstellationLookDirection` が返す平均方向を使う(`refreshConstellationDisplay` の戻り値を利用するよう変更し、二重計算を避けた)
- 星タップ(Task 5)と検索選択で「星の情報表示+所属星座の線/ラベル表示」ロジックが重複していたため、`Starfield.tsx` に共通の `selectStar` 関数を切り出して両方から呼ぶ形にリファクタリング
- 星座のみを検索選択した場合(特定の星は選んでいない)は `StarInfoOverlay`(星固有の情報パネル)は開かず、星座線・星座名ラベルのみ表示する
- ラベルの重なり対策(ズーム時の再計算・密集時の間引き)は Task 5 の追加対応として先に実装済みで、検索選択で表示する星座線・ラベルにもそのまま適用される(実装が分かれていないため)

完了確認:
- 星座名・星名で検索し、該当する星・星座へ視点が移動する → 済。unit test(`src/search/searchIndex.test.ts`)でマッチングロジック(英語/日本語、大文字小文字、空クエリ、非該当)を確認。e2e(`e2e/search-smoke.spec.ts`)で実際のブラウザ上での検索→選択→情報表示/ラベル表示までを確認(chromium/mobile-chrome 両方、console error なし)
- 該当なしの場合にエラーにならず適切に扱われる → 済(該当なしのとき「該当なし」を表示。unit test で空配列が返ることを確認)
- typecheck / lint / unit test(95件)/ production build / e2e(8件)すべて成功

置いた仮定:
- 検索でマッチした星・星座が現在地平線下でも(=実際には見えていなくても)選択・視点移動を許可する。地平線下カットは`generateRealStarData`側の描画対象の話であり、検索は「単純なマッチング」という feature spec の記述通り現在の可視性でフィルタしない方が実装をシンプルに保てると判断した。視点が地平線下を向いても、このアプリはまだ地平線・地面を描画しない(4次スコープ)ため、見た目上は単に何もない暗い空になるだけで新たな破綻は生まない
- 検索結果の選択後、検索パネルは自動的に閉じる(結果が星空表示の妨げにならないようにするため)。クエリ文字列自体はパネルを閉じても保持する(再度開いたときに毎回打ち直さずに済むようにするため)

「次の星座を表示する」機能の追加対応(Task 6 の一部として実施、Status は Done のまま):
- 人間に確認したところ、Task 3/4 で作っていた開発時専用のテストボタン(その瞬間見えている星座を1つ選んで線・視点を表示する暫定コード。Task 5 で実選択ロジックに置き換わり削除済み)と同じ動きを、正式な機能として復活させてほしいとのことだった
- `src/NextConstellationButton.tsx`(新規)として実装。`import.meta.env.DEV` ガードは外し、常時表示のボタンとして SearchOverlay の右隣(top-left の同じ行)に配置。開閉パネルを持たないため、SearchOverlay とは責務を分けて別コンポーネントにした
- `Starfield.tsx` の `handleNextConstellation`: `loadConstellationCatalog()` の全星座を `computeConstellationLineSegments` で現在地平線上に線分が1本でもあるものだけに絞り込み、名前順にソートした一覧を「次へ」の巡回順とする。現在選択中の星座(検索やタップで選んだものも含む)の次の要素を選び、末尾まで行ったら先頭に戻る。選択自体は Task 6 の `handleSelectConstellationResult` をそのまま再利用(線・ラベル表示、視点移動、検索パネルを開いていればそれも閉じる、という既存の挙動をそのまま踏襲)

完了確認:
- ボタン押下で現在見えている星座から別の星座へ切り替わる → 済。ブラウザで連続クリックし、押すたびに異なる星座(例: Andromeda → 別の星座)へ切り替わることを目視・スクリプトの両方で確認(console error なし)
- typecheck / lint / unit test(95件)/ production build / e2e(8件)すべて成功

置いた仮定:
- 巡回順序は星座名(英語名)のアルファベット順とした。IAU 88 星座の並びや天球上の位置順など他の順序も考えられるが、「毎回同じ順で一周できる」という分かりやすさを優先した
- 「現在見えている星座」の判定は、既存の地平線下カット(`computeConstellationLineSegments` が返すセグメントが1本以上あるか)をそのまま流用した。画面内に映っているかどうか(カメラの視野角)までは見ていない — 視野の外を向いていても地平線上にあれば巡回対象に含まれる
- 検索専用だった `overlayPanelStyleLeftAnchored` 等はそのまま残置し、次の星座ボタンは新規追加の別コンポーネントとした(検索パネルの開閉状態とは独立して動作する)

### Task 7 — 豆知識コンテンツの追加

Status: Done

- `src/constellations/constellationTrivia.ts`(新規)に、d3-celestial の全89 features(IAU 88 星座 + Serpens Caput/Cauda)分の一文豆知識を手動キュレーション。特定の外部データセット・著作物からの引用ではなく、一般に知られた神話・天文知識をもとに書き起こしたもの(`starNameJa.ts` の「手動キュレーション」方針を踏襲。出典の明記は不要と判断し、その旨をファイル冒頭のコメントに記録)。`ConstellationRecord.id` は Serpens Caput/Cauda で重複するため、一意な `name` をキーにした
- `src/stars/starTrivia.ts`(新規)に、`starNameJa.ts` の STAR_NAME_JA と同じ約110件の有名な固有名付き星について、同じキュレーション方針で一文豆知識を追加。キーは `HygStarRecord.properName`
- `src/stars/starInfo.ts` の `SelectedStarInfo` に `trivia: string | null` を追加。`buildSelectedStarInfo` は「タップした星自身の豆知識」を優先し、無ければ「所属星座の豆知識」にフォールバックする(星固有の豆知識が無い残り約330件の固有名付き星でも、所属星座があれば何かしら表示される)
- Task 6 で「星座のみを検索選択した場合は`StarInfoOverlay`を開かない」としていた挙動を本タスクで変更した。星座のみの選択でも豆知識を表示する必要があるため、`buildSelectedConstellationInfo`(新規)を追加し、`brightnessLabel`/`colorLabel` を `null` にした `SelectedStarInfo` を返す。`StarInfoOverlay.tsx` はこれらが `null` の場合、明るさ・色の行を描画しない(名前+豆知識のみのパネルになる)。`Starfield.tsx` の `handleSelectConstellationResult`(検索・「次の星座」ボタン共通)がこれを呼ぶよう変更
- 上記の挙動変更に伴い、`StarInfoOverlay` の閉じるボタンの aria-label を「星の情報を閉じる」から「選択情報を閉じる」へ変更(星座のみの選択でも表示されるパネルになったため)。`e2e/star-selection-smoke.spec.ts`・`e2e/search-smoke.spec.ts` を追従修正(後者は星座のみ選択時に閉じるボタンが表示される新しい挙動に合わせてアサーションを更新)

完了確認:
- 選択した星・星座に対応する豆知識が表示される → 済。ブラウザで星(Altair)・星座のみ(Ursa Minor)の両方の選択を確認(スクリーンショット取得、console error なし)。unit test(`constellationTrivia.test.ts`: カタログ全89件の豆知識の存在を検証、`starTrivia.test.ts`、`starInfo.test.ts`: 星自身の豆知識優先/星座へのフォールバック/星座のみ選択時の組み立てを確認)
- Human Check(情報量が癒し用途として適切か)→ 未実施。人間の確認待ち
- typecheck / lint / unit test(103件)/ production build / e2e(8件)すべて成功

置いた仮定:
- 豆知識の分量は一文(約30〜80字)に統一し、数値中心の観測データ(距離・スペクトル型等)は含めないこととした(Product Principle 2、`phase-3-star-knowledge.md` の Out of Scope「星・星座の詳細な学術情報」に抵触しないため)
- 星の豆知識は Task 4 で日本語名をキュレーションした約110件の有名な固有名付き星のみを対象とした(HYG の固有名付き星は約440件あるが、全件の豆知識を独自に書き起こすのは事実確認のコストが高く、有名な星に絞る方が品質を保ちやすいと判断)。対象外の星は、所属星座があればその星座の豆知識にフォールバックする
- 星座の豆知識は d3-celestial の全89 features を対象とした(星座は88種と少なく、検索・「次の星座」ボタンでどの星座を選んでも何かしら表示されることを優先した)

### Task 8 — コードレビュー

Status: Done

`/code-review`(複数観点のエージェントによるレビュー)で未コミットの差分全体(0次以降コミット前のため、実質 Phase 1〜3 相当)をレビューし、以下を修正した。

- **バグ修正(再生中にラベルが再びちらつく回帰)**: Task 5 完了後の追加対応で「星座選択が変わった時だけラベルの重なり回避を再計算する」よう直した(`useEffect(resetDeclutterState, [labels])`)はずだったが、`refreshConstellationDisplay` は再生中(`handleDateChange`/`handlePlaybackTick`、最大15Hz)のたびに `setConstellationLabels([...])` で新しい配列を生成しており、内容が同じでも配列参照が毎回変わるため `useEffect` が毎ティック再発火し、ちらつき対策が実質無効化されていた。`ConstellationLabelsOverlay.tsx` の依存を配列参照ではなくラベル内容(key/text/variant)から作った文字列キーに変更し、構成が変わらない限り再計算しないよう修正
- **バグ修正(検索:よくある1文字などで検索すると星が一切ヒットしない)**: `searchIndex.ts` の検索は星座(89件)を星(固有名付き約440件)より先にインデックスしており、結果上限(20件)を「先にヒットした順」で単純に打ち切っていたため、星座だけで20件に達する検索語(例: `"a"` は53星座にヒット)では星が一件も調べられずにヒットしなかった。星座・星それぞれに結果枠を分けて確保するよう修正し、回帰テストを追加(`searchIndex.test.ts`)
- **効率化**: `findHygStarById`(`hygCatalogSource.ts`)は「選択時に1回だけ呼ばれる想定」のコメント付きで線形探索していたが、実際には `Starfield.tsx` の星座ラベルのソート比較関数内から再生中も繰り返し呼ばれていた(最大15Hz × 星座内の星数 × 比較回数、そのたびに約8,900件を線形探索)。内部でIDマップをキャッシュしO(1)に変更
- **リファクタ(重複排除)**: `mathUtils.ts` の `clamp` を使わず独自に `Math.min(Math.max(...))` を書いていた箇所(`compassBearing.ts`, `realStarDataSource.ts`)を `clamp` 呼び出しに統一。`overlayStyles.ts` の `overlayPanelStyle` / `overlayPanelStyleLeftAnchored`(左右のみ違う完全重複)を `overlayPanelStyle(anchor)` 関数に統合し、呼び出し側(`DateTimeOverlay.tsx`, `LocationOverlay.tsx`, `SearchOverlay.tsx`)を追従

指摘はあったが対応を見送ったもの(重大度が低いか、既存の意図的な仕様のため):
- 検索・「次の星座」で地平線下の星/星座も選択・視点移動を許可する挙動 → Task 6 で既に人間確認済みの意図的な仕様(完了確認の「置いた仮定」参照)であり、レビューでの再指摘は誤検知
- `lookAt()` 実行時、直前に投影済みのラベル位置が1フレームだけ旧カメラ向きのまま表示される(検索選択・「次の星座」時) → 60fpsで1フレーム(約16ms)のみの軽微な視覚的ズレで、修正には選択フローの再構成が必要なため見送り
- 密集したラベル(3つ以上重なる場合)の重なり回避が必要以上に大きくずれることがある(`ConstellationLabelsOverlay.tsx` の `declutter`) → 常に重なりは解消される(見た目が壊れることはない)ため優先度低
- `civilTime.ts` の夏時間切り替わり(春の time-gap)ちょうどの時刻を渡すと1時間ずれる → 年1回・1時間のみの極端なエッジケースで、多くの日時ライブラリが採用する「繰り上げ」と同じ挙動になり例外は出ない
- `StarfieldRenderer` に星座線レイヤーが直接乗っている、`Starfield.tsx` に選択/検索の統括ロジックが集中している等のアーキテクチャ観点の指摘 → 現状は動作しており、将来のフェーズで機能が増えたタイミングで判断する方が実情に合うため今回は見送り
- 削除された `starDataSource.test.ts` が検証していた性質(明るさ分布の偏り、twinkle振幅の相関)が新しいテストスイートに引き継がれていない → テストカバレッジの退行であり、今回のレビュー対応の主眼(実際に踏む不具合の修正)からは外し、次回のテスト整備時の課題として残す

検証: typecheck / lint / unit test(104件、検索の回帰テストを1件追加)/ production build / e2e(8件)すべて成功。console error なし。

完了確認:
- 重大な指摘がない、または対応済み → 済(上記参照)

### Task 9 — 自動検証の仕上げ

Status: Done

- typecheck / lint / unit test / production build / e2e を一通り実行し、すべて成功を確認(追加の修正は不要だった)
- README.md の Current Phase を「実装完了、自動検証済み、Human Check 待ち」に更新し、3次で実装した内容の一覧を追記。DEVELOPMENT.md の Phase Roadmap(3次)のラベルを「進行中」から「実装完了、Human Check 待ち」に更新

完了確認:
- `phase-3-star-knowledge.md` の Acceptance Criteria(Automated / Technical)をすべて満たす → 済
  - typecheck: 成功(エラーなし)
  - lint: 成功(エラーなし)
  - unit test: 104 件すべて成功
  - production build: 成功(`dist/assets/index-*.js` が 500KB を超える旨の chunk size warning のみ。three.js 由来で以前から既知、ビルド失敗ではない)
  - e2e(Playwright, chromium/mobile-chrome): 8 件すべて成功、console error なし
- 3次全体の Human Check に進める状態になっている → 済(本タスクで確認)。`phase-3-star-knowledge.md` の Human Check 項目(星座線・星座名の落ち着き、通常時のUI非表示、星タップ/検索での選択、豆知識の分量、PC/スマホでの表示崩れ)はまだ人間による確認待ち

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
