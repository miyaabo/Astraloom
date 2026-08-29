# DECISIONS

重要で後から変更コストが高い判断だけを記録する。
小さな実装判断はここに残さない。

---

## D001 — Webアプリを Primary Platform とする

Status: Accepted

### Decision

初期〜個人利用は Web アプリとして開発する。

### Reasons

- Windows 11 環境だけで開発できる
- Mac を前提にしない
- PC とスマホの両方で利用できる
- スマホから Nebula Capsule 3 Laser へ AirPlay ミラーリングする利用形態と相性がよい
- 将来 PWA やラッパー型アプリへ展開する余地がある

### Consequences

- 0次はブラウザ互換性とモバイル GPU 性能を重要視する
- iOS ネイティブ固有機能は初期スコープ外

---

## D002 — TypeScript + React + Vite

Status: Accepted

### Decision

アプリ基盤に TypeScript + React + Vite を採用する。

### Reasons

- TypeScript で天文データ・描画パラメータの型を明確にできる
- Vite は WebGL アプリの試作を高速に回しやすい
- React は 0次では薄く使い、将来の設定画面・検索・星情報・認証 UI へ自然に拡張できる
- UI と Three.js renderer を分離すれば、描画ロジックを React へ過度に依存させずに済む

### Rules

- React は UI / application shell に使う
- 星の描画エンジンは React component へべったり埋め込まない
- Redux 等の大きな state 管理は必要になるまで導入しない
- UI component library も 0次では不要

---

## D003 — Three.js / WebGL を星空描画基盤とする

Status: Accepted

### Decision

星空描画には Three.js を使用し、GPU ベースの描画を行う。

0次では平面表示でよい。
完成系で球面表示を追加できる構造を維持する。

### Reasons

- 数千〜多数の星を DOM より効率よく描画できる
- 色・明るさ・サイズ・グロー・瞬きを shader で細かく制御できる
- 将来の球面配置、カメラ、ズーム、視点移動へ拡張しやすい
- PC／スマホの WebGL で利用可能

### Initial Rendering Direction

0次は以下を第一候補とする。

- `BufferGeometry`
- 星ごとの attribute（position / size / color / brightness / phase 等）
- custom `ShaderMaterial`
- point sprite または GPU で描く billboard 表現

実装中にスマホ互換性や PointSize 上限が品質を阻害する場合、instanced quad 等への変更を Claude Code が提案してよい。

### Important Constraint

「星の見た目」と「星の位置計算」を分離する。
0次の visual tuning を、将来の実データ／球面表示でも再利用できるようにする。

---

## D004 — 星空表現設定を一元管理する

Status: Accepted

### Decision

星の見た目に関わる調整値をコード全体へ散らさず、設定オブジェクト／module へ集約する。

例:

- background colors
- global brightness
- size curve
- brightness distribution
- glow strength
- halo radius
- color saturation
- twinkle amplitude
- twinkle speed
- motion speed
- star count / density
- DPR cap

### Reason

0次は Human Check を通して繰り返しチューニングするため、変更速度が重要。

将来の表現プリセットへの拡張にも使える。
ただし 0次ではユーザー設定 UI を作らない。

---

## D005 — 0次は仮データ、実データは 1次で選定する

Status: Accepted

### Decision

0次では仮の星データを使用する。
数千〜1万程度を扱える負荷感で星空表現を評価する。

実星データソースは 1次開始時に正式選定する。

### Candidate Direction

将来は ESA Gaia 等の公的・信頼できる星カタログを候補として調査する。

正式採用前に必ず確認する。

- 商用利用条件
- 必要な星数
- 等級／色データ
- proper motion 等の必要性
- 配布／再配布条件
- Web 向け前処理方法

候補を挙げるだけで、Gaia 採用を現時点で確定しない。

---

## D006 — Mobile quality is a first-class requirement

Status: Accepted

### Decision

PC とスマホで同じ表現思想を保つ。
スマホを「簡易版」とは位置付けない。

### Performance Strategy

必要に応じて内部的に調整する。

- DPR cap
- star count
- shader quality
- effect complexity

自動調整は見た目の方向性を壊さない範囲で行う。

---

## D007 — Backend を 0次で作らない

Status: Accepted

### Decision

0次は完全にクライアントサイドで成立させる。

### Reasons

- ログイン不要
- DB 不要
- 外部 API 不要
- 星データは仮データ
- 0次の目的は表現品質確認

backend / serverless / DB / auth / storage は必要なフェーズで選定する。

---

## D008 — テストと Human Check を分ける

Status: Accepted

### Decision

コードの正常性は自動テストで確認するが、星空の品質は Human Check を完了条件にする。

### Automated

- TypeScript
- lint
- unit test
- browser smoke
- build

### Human

- 星空として自然か
- プラネタリウムらしいか
- グロー／瞬きがうるさくないか
- PC とスマホで品質感が揃うか
- Visual Target から大きく外れていないか

---

## D009 — 将来の設定 UI は星空画面上のオーバーレイを基本方向とする

Status: Accepted as Direction, not detailed UI spec

### Decision

設定のために星空体験から完全に別ページへ離れるより、星空画面にボトムシート／サイドパネル等を重ね、閉じれば星空へ戻れる UX を基本方向とする。

### Not Decided

- 下から出すか横から出すか
- PC とスマホで同じ UI か
- 設定階層
- アイコン配置

これらは設定機能を実装するフェーズで決める。

---

## D010 — Security is incremental, not deferred

Status: Accepted

### Decision

セキュリティは公開直前に一括対応するのではなく、機能追加に合わせて段階的に強化する。

### Initial Requirements

0次でも最低限以下は守る。

- API キーをクライアントへ埋め込まない
- 未検証データを危険な方法で描画しない
- 不要な依存を増やさない
- 脆弱性のある依存を放置しない

将来の認証・課金・アップロード・外部 API は、それぞれのフェーズで追加要件を定義する。

---

## D011 — 0次のビジュアル基準は「幻想的な宇宙写真」ではなく「プラネタリウム基準」とする

Status: Accepted

### Decision

0次開発の星空表現は、まず **プラネタリウムらしい星の見え方** を基準にする。

### Means

- 星は小さくシャープな点を基調とする
- 明るさに階層を持たせる
- 大半の星は小さく、明るい星だけ少し目立たせる
- 強いグローは避け、ごく明るい星だけ軽くにじませる
- 背景は暗く落ち着いていて、星が映えることを優先する
- 宇宙写真のような派手な星雲感を 0次の中心にしない

### Reason

ユーザーのイメージに最も近いのが「本物のプラネタリウム」であり、ここを基準にした方が今後の Human Check もぶれにくい。

---

## D012 — Visual Target 画像を正式な要件として扱う

Status: Accepted

### Decision

0次開発では、以下の画像を正式な Visual Target として扱う。

- `docs/references/phase-0-visual-target.png`

### Rule

この画像は単なるムードボードではない。
完全なピクセルコピーは不要だが、少なくとも以下はこの画像の方向性に沿うこと。

- 星のサイズ感
- 明暗差
- グローの強さ
- 背景の暗さ
- 密度感
- プラネタリウムらしさ

### Reason

文章だけでは見た目の解釈幅が広すぎるため、Visual Target を仕様の一部として明示した方がズレを減らせる。
