# Phase 0 — Starfield Rendering

## Status

**Done** — Human Check 完了。Acceptance Criteria(Automated / Human Check Must Pass 全 13 項目)をすべて満たし、1次開発へ移行可能。

次フェーズ: `docs/features/phase-1-real-sky.md`(1次 — 本物の夜空)

## Goal

完成系につながる品質の星空表現を作り、ユーザーが実物を見て「ちゃんとした夜空に見える。この見た目なら今後も開発したい」と判断できる状態にする。

0次開発は機能試作ではなく、プロダクトの根幹である星空表現の検証フェーズ。

## Visual Reference

0次開発の星空表現は、以下の画像を **Visual Target** として扱う。

- `docs/references/phase-0-visual-target.png`

この画像は単なる雰囲気参考ではない。
完全なピクセルコピーは要求しないが、以下の要素はこの方向性から大きく外れないこと。

- 星のサイズ感
- 明るい星と暗い星の階層
- グロー／にじみの強さ
- 背景の暗さ
- 全体の密度感
- 「プラネタリウムらしい」見え方

## UX Intent

起動すると余計な UI を表示せず、すぐに星空だけが見える。

ユーザーは操作を求められず、少なくとも 1 分程度、静かに動いている夜空を眺められる。

目標の印象:

- プラネタリウム的
- 落ち着いている
- カラフルすぎない
- ネオン／ゲーム背景っぽくない
- 「宇宙写真」ではなく「投影された夜空」に近い
- 星が大きな発光玉に見えない
- 明るい星だけが少し目立つ

## Target Platforms

### Desktop

- Windows 11
- Chrome latest

### Mobile

- Chrome
- Safari
- 縦画面優先

PC とスマホで見た目の方向性を揃える。

## Visual Requirements

### Background

初期方向:

- 黒一色でも、明るい青紫でもない
- 暗く落ち着いた青黒〜濃紺系
- 星が映える程度のわずかな階調は許容
- 背景は主役ではなく星を支える
- 0次では派手な星雲表現に寄せない

### Star Color

一般的なプラネタリウム寄り。

- 白を中心
- 一部の明るい星に青白
- 一部に黄〜淡い橙
- 色差は控えめ
- 星全体をカラフルにしない

### Brightness

- 明るい星と暗い星に明確な階層
- 全て同じ強さにしない
- 明るい星だけが適度に視線を引く
- 暗い星は密度感を支える

### Size

- 小さくシャープな点が中心
- brightness と整合するサイズ差
- 大きすぎる丸い光源を大量に作らない
- 明るい星の一部のみ存在感を持たせる

### Glow / Halo

重要な評価対象。

- 基本は控えめ
- ごく明るい星にだけ自然な halo
- core と halo の階調を持つ
- glow が強すぎてネオン化しない
- 暗い星へ過剰な glow を付けない
- スマホでも潰れない

### Density

仮データで数千〜1万程度を想定する。

実際に毎フレーム全部を同じ強度で見せる必要はない。
視覚的に自然な密度分布を作る。

### Twinkle

一般的なプラネタリウムに近い控えめさ。

- 全星が同期して点滅しない
- phase を星ごとにずらす
- amplitude を小さくする
- 暗い星はほぼ静かでもよい
- 明るい星の一部だけわずかに変化が分かる
- チカチカして睡眠前の邪魔にならない

### Motion

少なくとも 1 分程度は連続して「再生されている」と感じられる。
0次では正確な天体運動は不要。

許可される表現:

- ごく緩やかな全体移動
- 微細な視差的変化
- twinkle animation

大きく流れる／速く回転する演出は避ける。

## Data Requirements

0次は実星データ不要。
仮データでよい。

ただし、将来の実データへ置換しやすいよう、star source と visual rendering を分離する。

仮データは少なくとも以下を生成できる形が望ましい。

- position
- pseudo brightness / magnitude-like value
- color category or temperature-like value
- twinkle phase
- twinkle amplitude
- optional size variance

## Technical Direction

第一候補:

- Three.js
- WebGL
- BufferGeometry
- custom ShaderMaterial
- GPU point sprite または同等の GPU 描画

Claude Code は実装中に、スマホ互換性や描画品質の理由で別の Three.js GPU 手法が明確に優れると判断した場合は変更してよい。

ただし、React DOM 要素で星を大量描画しない。

## Tuning Interface for Development

ユーザー向け設定画面は作らない。

開発用に星空表現パラメータを 1 module / config へ集約する。

最低限調整しやすくする候補:

- star count
- global brightness
- size min/max or curve
- brightness distribution
- glow strength
- halo radius
- color saturation
- background colors
- twinkle amplitude
- twinkle speed
- motion speed
- DPR cap

開発用 GUI ライブラリは、必要性が明確でなければ導入しない。
コード上の config 編集で十分ならそれを優先する。

## Performance Expectations

厳密な FPS 数値は 0次開始時には固定しない。

最低条件:

- PC Chrome で明らかなカクつきがない
- 対象スマホで見て不快なカクつきがない
- 1 分連続実行で劣化しない
- resize / orientation 変化で致命的に壊れない
- console に継続的な error を出さない

必要なら計測後に具体的な performance budget を追加する。

## Accessibility / Motion

`prefers-reduced-motion` を尊重する。

reduce 時は完全に真っ暗にしたりアプリを使えなくしたりせず、twinkle や移動量を大幅に抑えた静かな星空を表示する。

## Acceptance Criteria

### Automated / Technical

- TypeScript compile/typecheck 成功
- lint 成功
- unit test 成功
- production build 成功
- desktop Chrome で星空が表示される
- mobile viewport で画面が破綻しない
- 1 分以上 animation が継続する
- console error なし

### Human Check — Must Pass

ユーザーが PC とスマホ実機で確認する。

以下を満たすこと。

1. 星空として見える
2. プラネタリウムらしいと感じる
3. 星が大きすぎない
4. 明るさの階層が自然
5. サイズ差が自然
6. グロー／にじみが美しいが強すぎない
7. 星の色がカラフルすぎない
8. 背景が暗く、星が映える
9. 瞬きが控えめ
10. 1 分眺めても演出がうるさくない
11. スマホでも品質が大きく落ちない
12. Visual Target と方向性が大きくズレていない
13. 「この星空を土台に続きを作りたい」と感じる

Human Check で NG の場合、1次開発へ進まず星空表現を Iterate する。

## Out of Scope

- 実星カタログ
- 正確な星座標
- 日時指定
- 場所指定
- 天体運動計算
- 時間再生 UI
- タイマー UI
- 設定画面
- 星座
- 星情報
- 検索
- 球面表示
- カメラ操作
- 天の川
- 流れ星
- 地平線／風景
- BGM
- 環境音
- 音楽ファイルアップロード
- 保存
- 動画出力
- アカウント
- 課金
- backend
- external API
- AR

## Questions Claude May Ask

実装前に質問できるのは、主に以下のように結果が大きく変わる未決定事項が出た場合。

- 2 つの星表現案がどちらも妥当で、Human Check なしでは決められない
- スマホ性能と見た目の間で大きな trade-off が発生した
- shader 方式を変更しないと目標品質に届かない
- Product Principles と技術制約が衝突した

小さな実装詳細では質問せず、合理的に判断して進める。

## First Claude Code Task

この Feature Spec とプロジェクト文書を読み、既存コードがなければ 0次開発に必要な最小プロジェクトを初期化する。

その後:

1. 星空描画の最小実装方針を Plan する
2. Visual Target との差が出やすいポイントを整理する
3. 仮星データ生成
4. Three.js / WebGL renderer
5. 星空表現 config
6. animation
7. responsive 対応
8. 自動検証
9. Human Check 用にローカル起動方法を提示

0次の Out of Scope 機能は追加しない。
