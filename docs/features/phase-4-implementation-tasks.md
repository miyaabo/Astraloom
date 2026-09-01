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

### Task 2 — 天の川の配置・描画の土台実装

Status: Done

実装内容: `src/stars/milkyWay.ts` に銀河面(galactic plane)の配置ロジックを実装した。銀河座標(l, b)を赤道座標へ変換する`galacticToEquatorial`(既知の銀河座標系回転行列を使用、天文的に妥当な位置にする一方、正確な変換ライブラリは導入していない)と、銀河面付近に粒子を散布して帯状に見せる`generateMilkyWayBand`(既存の`equatorialToHorizontalAtHourAngle`/`projectHorizontalToSphere`を呼ぶのみで、変更はしていない)を追加。`StarfieldRenderer`に星とは別の`THREE.Points`レイヤー(専用の簡易シェーダー、加算合成、twinkle/halo なし)として追加し、`starfieldConfig.milkyWay`に密度・帯の幅・粒子サイズ・不透明度・色のパラメータの器を用意した(値は仮、Task 3 で調整)。

- 天の川の帯としての位置・形状の生成ロジックを実装する(天球上で妥当に見える簡略化表現でよい。正確な銀河座標変換は必須としない。固定的な帯状配置で妥当かは Task 3 の Human Check で判断する)
- 既存の星 shader / renderer(`src/render/` 配下)を拡張し、天の川を星と同じ描画パイプライン上にパーティクル/シェーダー表現として追加し、画面に表示されることを確認する。この段階では密度・明るさ等の細かい見た目調整は行わない
- 天の川用の調整パラメータ(密度・明るさ・帯の幅など)の器を `starfieldConfig.ts` 等、既存の一元管理設定に追加する(D004)

完了確認:

- [x] 天の川が球面星空上に(粗い調整のままでよいので)表示され、視点移動・ズームでも破綻しない(Chrome desktop + Pixel 7 viewport で目視確認、console error なし)
- [x] 星の既存の見た目(shader・`starVisualAttributes`)・位置計算に影響を与えていない(星の shader・`starVisualAttributes.ts`・`astronomy/`・`skyProjection.ts` は無変更)
- [x] typecheck / lint / unit test / build が成功する

### Task 3 — 天の川の見た目調整 + Human Check

Status: Done

実装内容: `starfieldConfig.milkyWay` を2段階で調整した。

1段階目: `particleCount: 4000→9000`, `pointSizePixels: 5→4`, `baseOpacity: 0.12→0.09`。粒子がまばらで散らばった点のクラスタに見えていたのを、粒子数を増やし1粒子あたりのサイズ・不透明度を下げることで連続的な淡い帯として読めるようにした。

2段階目(Human Check フィードバック「天の川はどこにあるか分からなかった」を受けて): `particleCount: 9000→14000`, `pointSizePixels: 4→5`, `baseOpacity: 0.09→0.18`, `bandWidthDegrees: 8→9`。1段階目はスクリーンショットを注視すれば見えるが、実際に画面をドラッグして探す体験では見落とすほど淡すぎた。Chrome headless で東京・現在時刻(デフォルト設定)のまま画面を一周パンして確認し、それとなく視界に入る程度まで明るさ・密度を上げた。なお現状も星の最大アルファ(0.45〜1.0)より天の川粒子1個あたりの最大アルファ(0.18)は低く、加算合成で重なる中心部でも星ほど明るくならないため、Product Principle 1・5(星より目立たせない)は保っていると判断している。

星の shader・`starVisualAttributes`・位置計算は変更していない。

- Task 2 で追加したパラメータを調整し、Product Principle 1(プラネタリウム基準, D011)・5(Calm by Default)を満たす密度・明るさ・帯の幅にする。星より目立たせない
- Human Check を実施し、フィードバックを反映する(見た目中心の機能のため、ここで一旦人間確認を挟む)

完了確認:

- [x] typecheck / lint / unit test / production build が成功する
- [x] Chrome headless で天の川の帯が表示され、console error なし(desktop 1280x800 / mobile 412x915 viewport で確認)
- [x] 天の川が Visual Target・プラネタリウム基準から大きく外れておらず、星より目立っていない
- [x] PC・スマホで同じ印象になっている
- [x] Human Check で合意が取れている(実機確認で「それっぽいのが見えた気がする」と確認済み)

### Task 4 — 地平線/風景の配置・描画の土台実装

Status: Done

実装内容: `src/stars/horizon.ts` に地平線から真下(nadir)までを覆うドーム状メッシュの頂点/インデックス生成ロジック(`generateHorizonMeshData`)を実装した。既存の`projectHorizontalToSphere`(無変更)を呼んで各頂点を星と同じ天球面上に配置し、地平線(高度0度)からの深さ(0=地平線、1=真下、負値=地平線より上のグロー領域)を頂点属性として持たせている。地平線/風景は観測者から見た地平座標系に固定されており、日時が進んでも星のように動かないため、日時・場所が変わっても再計算不要(`StarfieldRenderer`に`updateHorizon`相当のメソッドは無く、コンストラクタで一度だけ構築)。

`StarfieldRenderer`に星・天の川とは別の`THREE.Mesh`レイヤー(専用のシンプルなシェーダー、地平線より下は塗りつぶし、地平線付近はグロー、カメラが天球の内側にいるため`THREE.BackSide`で描画)として追加し、星・天の川より背面(`renderOrder: -2`)に配置した。`starfieldConfig.horizon`に分割数・グローの幅・地面色・グロー色・不透明度のパラメータの器を用意した(値は仮、Task 5 で調整)。

星の shader・`starVisualAttributes`・位置計算、天の川の実装は変更していない。

- 既存 shader の延長でシンプルな地平線/風景の形状生成ロジックを実装する(具体的な形状はシルエットやグラデーション等、実装時に合理的に判断してよい)
- 描画パイプラインに追加し、画面に表示されることを確認する。この段階では細かい見た目調整は行わない
- 地平線用の調整パラメータの器を既存の一元管理設定に追加する(D004)

完了確認:

- [x] 地平線/風景が球面星空上に(粗い調整のままでよいので)表示され、視点操作(ドラッグ・ズーム)・再生(時間経過)と組み合わせても破綻しない(Chrome desktop + mobile-chrome viewport で `npx playwright test`(既存の drag/wheel smoke テスト含む8件)がconsole errorなく全て成功。加えて一時的なスクリーンショット確認で、下方向にドラッグして地平線グロー・地面のシルエットが表示されることを目視確認済み)
- [x] typecheck / lint / unit test / build が成功する

### Task 5 — 地平線/風景の見た目調整 + Human Check

Status: Done

実装内容: `starfieldConfig.horizon` を、星空より前に出ない控えめな値へ調整した。`glowSpanDegrees: 10→7`, `glowColor: #4a5b8c→#23365e`, `glowOpacity: 0.25→0.16`, `groundColor: #02040a→#02050d`, `groundOpacity: 0.85→0.72`。加えて `StarfieldRenderer` の地平線フラグメントシェーダーで、地面の不透明化を浅い角度では進みすぎないよう `groundAmount` の立ち上がりを遅くし、グローは地平線近傍だけに残るよう深い角度では減衰させた。これにより、少し下を向いただけで画面下半分が黒く潰れる見え方を避け、地平線を「静かな下地」として扱う方向へ寄せている。スマホ実機で確認し、見た目に問題なしとして合意した。

- Task 4 で追加したパラメータを調整し、Product Principle 1・5 を満たす見た目にする
- Human Check を実施し、フィードバックを反映する

完了確認:

- [x] 地平線/風景が Visual Target・プラネタリウム基準から大きく外れていない
- [x] PC・スマホで同じ印象になっている
- [x] Human Check で合意が取れている(問題なし)

Task 5 完了後、人間から追加のフィードバックを受けて以下を追加対応したが、最終的には課題として残す方針にした(Task 5 の一部として実施、Status は Done のまま):

- **説明パネルと選択状態の分離**: `StarInfoOverlay` の `×` は説明文だけを閉じる挙動へ変更し、選択中の星座線・ラベルは維持するようにした。選択解除は別の明示ボタン `線を消す` へ分離
- **地平線境界の補助表現の試行**: 地平線付近にごく薄い `rim` を追加して空と地面の境界を読み取りやすくする案を試した。設定は `starfieldConfig.horizon.rimSpanDegrees` / `rimOpacity` に分離してあり、容易に戻せる状態
- **既知課題として残す点**: 背景が非常に暗いため、上記の補助表現を入れても地平線と星空の境界はなお分かりづらい。現時点では Product Principle 1/5 を崩さずに改善し切れていないため、この点は次タスクへ進まず既知課題として残す

### Task 6 — コードレビュー

Status: Done

Task 2〜5 の実装内容を対象にコードレビューを行い、以下を修正した。

- **バグ修正(検索で地平線下の星を選ぶと地面へ視点移動してしまう)**: 3次 Task 6 では「検索結果が地平線下でも視点移動を許可する」前提だったが、4次 Task 4/5 で地平線/地面ドームが追加されたことで、この挙動が実害のある回帰になった。`src/Starfield.tsx` の `handleSelectStarResult` は検索選択した星の高度をそのまま `renderer.lookAt()` に渡しており、高度が負の星を選ぶと地面や暗部へほぼ一直線に向いてしまい、選択結果として壊れて見える。検索選択時のみ視点移動の高度を地平線の少し上(2°)にクランプし、情報パネルは開きつつ「少なくとも夜空が見える」位置へ着地するよう修正した。星タップ時の挙動(すでに見えている星を選ぶだけで、カメラは動かさない)は変更していない
- **回帰テスト追加**: `src/Starfield.test.tsx` に、検索結果の星が現在は地平線下(`equatorialToHorizontal` が負高度を返す)でも `lookAt()` が負高度へ向かず、2°へクランプされることを確認するテストを追加

見送った指摘:

- `generateMilkyWayBand()` が粒子ごとに銀河座標→赤道座標変換を毎回やり直している件は、現状の Acceptance Criteria 上ただちに破綻を生んでおらず、計測なしで最適化へ踏み込む段階ではないため今回は見送り
- `updateMilkyWay()` が playback 中に毎回ジオメトリを作り直す件も同様。Task 7 の自動検証・実機確認で性能問題が見えた場合に改めて扱う

完了確認:

- [x] 重大な指摘がない、または対応済み

### Task 7 — 自動検証の仕上げ

Status: Done

typecheck / lint / unit test / production build / browser smoke test を通し、`phase-4-relaxation.md` の Acceptance Criteria(Automated / Technical)を満たすことを確認した。追加の修正は不要だった。

完了確認:

- [x] `phase-4-relaxation.md` の Acceptance Criteria(Automated / Technical)をすべて満たす
  - typecheck: 成功
  - lint: 成功
  - unit test: 118件すべて成功
  - production build: 成功
  - browser smoke test: Playwright 8件(chromium / mobile-chrome)すべて成功
  - console error なし
- [x] 4次全体が Human Check に進める状態になっている

## Status Legend

- `Not Started`
- `In Progress`
- `Done`
- `Blocked`(理由を併記)

## Change Log

このファイルはタスク進捗に合わせて Status を更新すること。設計変更があった場合は該当タスクの内容も更新する。使い捨てログとして放置しない。
