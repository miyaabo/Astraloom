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

### Implementation Note(Task 5 — 日時指定 UI)

Task 5 で実装した右上トグルボタン + 最小パネル(`src/DateTimeOverlay.tsx`)は、
D009 の「オーバーレイ方向」を満たすための **暫定的な最小実装** であり、
具体的な見た目・配置・インタラクションを正式決定したものではない。

将来、日時・場所・その他設定をまとめた本格的な設定 UI を作る際に、
このコンポーネントの外観は作り直される想定。
「実装済みだから仕様」として扱わないこと。

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

---

## D013 — 1次の星カタログとして HYG Database を正式採用する

Status: Accepted

### Decision

1次の実星データソースとして [HYG Database](https://codeberg.org/astronexus/hyg)(astronexus、Hipparcos + Yale Bright Star Catalog + Gliese の統合データセット)を採用する。

### Comparison

| カタログ | 商用利用 | mag≤6.5 の星数 | 主要フィールド |
|---|---|---|---|
| **HYG Database** | 明示的に可(CC BY-SA 4.0) | 約9,000〜9,600 | RA/Dec, Vmag, B-V, スペクトル型, 固有名(統合済み) |
| Hipparcos(-2) | 制限記載なし(グレー、実務上は長年の商用利用実績あり) | 約9,000 | RA/Dec, Vmag, B-V, スペクトル型 |
| Yale BSC5 | 制限記載なし(同上) | 9,110(等級6.5でほぼ完全) | RA/Dec, Vmag, B-V(UBV), スペクトル型 |
| Tycho-2 | 制限記載なし | 250万件から要フィルタ、前処理負担大 | RA/Dec, BT/VT(スペクトル型なし) |
| Gaia | 不可(CC BY-NC 3.0 IGO) | — | 非常に豊富だが商用利用不可・データ量過大 |

### Reasons

- 候補の中で唯一、商用利用が明文で許諾されている(Product Principle 7「商用利用条件が不明なものを中核依存にしない」に合致)
- ライセンス条件は表示義務(attribution)と、データファイル自体を再配布・改変する場合の ShareAlike のみ。アプリのソースコードや課金モデルには影響しない
- Hipparcos / Yale BSC5 は商用利用を妨げる記載はないが、明文の許諾もないグレーな状態であり、将来の収益化を前提とする Veluna では避ける
- Gaia は CC BY-NC のため今回は不採用(将来、より高密度な星空が必要になった際に別途ライセンス確認のうえ再検討する候補として残す)
- Hipparcos・Yale BSC・Gliese を統合済みの CSV で、RA/Dec・視等級・B-V 色指数・スペクトル型・固有名を含み前処理の手間が少ない
- mag≤6.5 でのフィルタ後の星数(約9,000〜9,600)が 0次の仮データ密度(6,000)と近く、見かけの密度感を維持しやすい

### Consequences

- Task 2 以降、`src/stars/` の実データ前処理は HYG Database の CSV を入力形式として実装する
- データファイルを加工・再配布する場合は CC BY-SA 4.0 の attribution 表記を README 等に残す
- 将来 Gaia 等より高精度なデータへ移行する場合は、本 Decision を更新し商用利用条件を再確認する

---

## D014 — 2次は球面表示へ完全移行し、PerspectiveCamera + ドラッグ操作を採用する

Status: Accepted

### Decision

2次(`docs/features/phase-2-playback.md`)では、1次の平面表示(天頂中心の円形投影)を球面表示へ**完全に置き換える**。平面表示との切替共存は行わない。

カメラは `THREE.OrthographicCamera` から `THREE.PerspectiveCamera` へ変更する。視点移動の入力方式は**ドラッグ操作のみ**とする(ジャイロセンサー入力は対象外)。

### Reasons

- 2次のゴールは「時間経過に伴う星の動きを没入感を持って眺める」ことであり、平面(天頂のみを見上げる円形投影)を維持するメリットは薄い。2つの描画経路(平面/球面)を並行維持するコスト(実装・テスト・UI の二重化)の方が大きい
- 星をカメラ原点から見た固定半径の球面(ドーム)上に配置し、原点から Perspective で見渡す方式が一般的なプラネタリウム/スカイビューアーの実装と合致する。視点回転(yaw/pitch)はカメラの向きで、ズームは FOV 操作で行う想定(星は原点から固定半径の球面上にあるため、カメラ位置を星へ近づける方式は不自然になる)
- 視点移動をドラッグ操作のみにするのは、D001 が想定する「スマホから Nebula Capsule 3 Laser へ AirPlay ミラーリングする利用形態」との相性を優先したため。スマホを空へ向けて構えるジャイロ操作は、画面を見ながら操作する体験(および画面をミラーリングして眺める体験)と相性が悪い。ドラッグ操作なら PC・スマホで同じ操作体系にできる
- 将来ジャイロセンサー入力を追加する余地は残すが、2次時点では対象外とする

### Consequences

- `src/stars/skyProjection.ts`(平面専用の `projectHorizontalToScreen`)は Task 2 で球面用のマッピング層に置き換える。天文計算(`src/astronomy/coordinates.ts`)・星データ・shader / `starVisualAttributes.ts` は変更しない(D003)
- `StarfieldRenderer` のカメラを `PerspectiveCamera` へ変更し、`resize()` のフラスタム計算(aspect 対応)を Perspective 用に書き換える
- Orthographic 前提で `camera.position` を動かしていた drift 演出(`starfieldConfig.motion`)は、Perspective + カメラ回転ベースの実装に合わせて見直す
- 平面表示は残さないため、1次の `projectHorizontalToScreen` は 2次完了後に不要になる見込み(Task 2 で削除するか判断する)

---

## D015 — 3次の星座線・星座名データソースとして d3-celestial(Olaf Frohn)を正式採用する

Status: Accepted

### Decision

3次の星座線・星座名データソースとして [d3-celestial](https://github.com/ofrohn/d3-celestial)(Olaf Frohn)の `data/constellations.lines.json`(星座線)・`data/constellations.json`(星座名)を採用する。

### Comparison

| 候補 | ライセンス | 商用利用 | データ形式 | 備考 |
|---|---|---|---|---|
| **d3-celestial** | BSD-3-Clause(リポジトリ直下 `LICENSE` に明記) | 明示的に可 | GeoJSON、RA/Dec 座標(`MultiLineString`) | IAU 公式 88 星座を元に Olaf Frohn が編集。星座名は多言語対応(日本語なし、英語 `en`/ラテン語 `la` 等) |
| Stellarium `constellationship.fab` | 本体は GPLv2+ だが、作者 xalioth が GitHub Discussion 上のコメントで星座線定義のみ MIT への再ライセンスを許諾 | 許諾コメントはあるが正式な LICENSE ファイルではない | Yale BSC(HR)番号ベースの頂点ペア | 星 ID ベースで HYG と直接紐付けやすいが、ライセンスの確実性で d3-celestial に劣る |

### Reasons

- d3-celestial はリポジトリ直下の `LICENSE` ファイルで BSD-3-Clause が明示されており、商用利用可否が明確(D013 の HYG 採用時と同じ判断基準)
- Stellarium の星座線データは GitHub Discussion のコメントで非公式に許諾されたものであり、正式なライセンス文書に基づかないため、将来の商用利用を前提とする Veluna では中核依存として避ける(Product Principle 7)
- d3-celestial のデータは IAU 公式 88 星座(実データは 89 features、Serpens が Caput/Cauda で分割されているため)を元にしており、座標系(J2000, RA/Dec)が HYG Database と整合する
- 星座線データは星 ID ではなく RA/Dec 座標(GeoJSON `MultiLineString`)で提供されるため、Task 2 で HYG の星データと座標近傍マッチングして頂点を対応付ける前処理が必要になる

### Consequences

- Task 2 以降、`src/stars/`(または新設モジュール)で d3-celestial の `constellations.lines.json`・`constellations.json` をビルド時に取り込み・前処理する
- データを取り込む際は BSD-3-Clause の copyright 表記を README 等に残す
- 頂点は HYG の星 ID への直接参照ではなく座標近傍マッチングで対応付ける(完全一致しない場合の許容誤差を Task 2 で設計する)

---

## D016 — 3次でも惑星・月・代表的天体を引き続き Out of Scope とする

Status: Accepted

### Decision

3次では惑星・月・代表的天体の位置表示を実装しない。恒星・星座情報のみを扱う。

### Reasons

- `docs/features/phase-3-star-knowledge.md` の Out of Scope では既に対象外として整理していたが、`PRODUCT.md` 側は「要否・時期は Small Spec で確認(未決定)」という曖昧な記載のままだったため、Task 1 で人間確認のうえ確定させた
- 惑星・月は恒星と異なり軌道計算(暦計算)という別種の技術要素が必要になり、スコープ・技術方針が大きく変わる

### Consequences

- `PRODUCT.md` の 3次 Out of Scope の記載を「未決定」から確定表現へ更新する
- 惑星・月・代表的天体は将来フェーズで、軌道計算の技術調査とあわせて Small Spec を作成のうえ再検討する

---

## D017 — 星座線は選択時のみ表示する

Status: Accepted

### Decision

星座線は通常状態では表示しない。星または星座を選択したときに、その星座の線のみを表示する。常時表示はしない。

### Reasons

- Product Principle 5「Calm by Default」を優先し、通常状態では星空そのものが主役であることを維持する
- 実際のプラネタリウム解説でも星座線は説明時にのみ提示されることが多く、この挙動と一致する
- 常時表示は Visual Target が想定する落ち着いた星空の密度感・静けさを損なうリスクがある

### Consequences

- Task 3(星座線の球面描画)は選択状態に連動する表示ロジックとして実装する(常時表示のオプションは作らない)
- 線の太さ・色は Task 3 実装時に Human Check で調整する

---

## D018 — 4次のスコープを「天の川・地平線/風景」に絞り、既存 shader の拡張で実装する

Status: Accepted

### Decision

4次(`docs/features/phase-4-relaxation.md`)の Scope Candidates(Sound / View・Rendering / Playback・Session)のうち、今回は **天の川・地平線/風景** のみを実装する。Sound(内蔵 BGM・環境音・ユーザー音楽ファイル等)、表現プリセット・夜空背景プリセット・プロジェクター向け表示補正、スリープタイマー・自動 UI 非表示・終了時フェードは今回のスコープに含めない。

天の川・地平線/風景の表現方法は、静的画像アセットではなく **既存の星 shader の延長(パーティクル/シェーダー手法での密度・グロー表現)** を採用する。外部の画像アセットは導入しない。

### Reasons

- Task 1 で人間確認のうえ、4次候補群の中から天の川・地平線/風景を優先領域として選定した。他候補(Sound 等)は技術領域が大きく異なり、1フェーズにまとめると範囲が大きくなりすぎるため今回は見送る
- shader 拡張を採用したのは、星と同じ描画パイプライン(`StarfieldRenderer` / `starVisualAttributes`)で密度・グローを制御でき、画像アセットのライセンス確認(Product Principle 7)や配布サイズの懸念が発生しないため
- 静的画像アセットは実写的な地平線表現には有利だが、今回はプラネタリウム基準(D011)の抽象的な表現で十分と判断した

### Consequences

- Task 2 以降は天の川・地平線/風景の shader 拡張のみを対象に分割する。Sound / 他の View・Rendering プリセット / Playback・Session のタイマー系は今回実装しない(将来フェーズで再度スコープ確定が必要)
- 画像アセットを使わないため、ライセンス確認は不要
- 天の川・地平線/風景は星の位置計算(D003 の「見た目と位置計算の分離」)とは別の表現要素として追加し、既存の星データ・座標変換・カメラ/再生エンジンには手を入れない

---

## D019 — 5次は表示体験を優先し、鑑賞モードを起点に段階的に進める

Status: Accepted

### Decision

5次(`docs/features/phase-5-display-experience.md`)では、保存・共有より先に **表示体験の整理** を行う。実装順は以下で確定する。

1. 鑑賞モード
2. UI 自動非表示
3. 表現プリセット
4. プロジェクター向け表示補正

4機能はいずれも 5次スコープに含めるが、**鑑賞モードとプロジェクター向け表示補正は別機能** として扱う。鑑賞モードは通常利用でも使う「UI を静かに退避するモード」、プロジェクター向け表示補正は投影時の暗部つぶれや UI の主張を抑えるための個別調整であり、内包関係にはしない。

表現プリセットは `Planetarium-like` を基準に、方向性を壊さない軽い差分のみを許容し、**最大 2 種** までに制限する。惑星・月・新規データ導入や軌道計算は 5次に含めない。

### Reasons

- 現時点の Veluna は、実データ星空・再生・視点移動・星/星座の知識・天の川/地平線まで揃っており、次に価値が高いのは「増やす機能」より「静かに眺めやすくする表示体験」の整理である
- 保存・共有は有用だが、まずは Product Vision の「情報や UI に邪魔されず夜空へ没入できる」を強める方が、現在の利用目的(就寝前の鑑賞、スマホ/プロジェクター利用)に直結する
- 鑑賞モードとプロジェクター補正を分けることで、通常利用での UI 整理と、投影環境固有の表示調整を混同せず設計できる
- 表現プリセットを軽い差分に制限することで、Product Principle 1「Planetarium-like First」と D011 のビジュアル基準を守りつつ、D004 の設定一元管理を活かせる

### Consequences

- 5次 Task 2 以降は、まず表示状態モデルの整理から着手し、鑑賞モードと UI 自動非表示が共存できる構造を優先して実装する
- プロジェクター向け表示補正は 5次の後半で扱い、通常表示や鑑賞モードとは独立した調整項目として設計する
- 表現プリセットは大きな絵作り変更を避け、背景・グロー・ラベル/UI の扱いを中心とした既存パラメータ調整で実現する
- 惑星・月・新規データ導入は、将来フェーズで別途 Small Spec を作成のうえ再検討する

---

## D020 — 6次は共有や出力より先に、ローカル保存による再開体験を優先する

Status: Accepted

### Decision

6次では、保存・出力候補のうち **最後の状態から再開** と **お気に入りシーンの最小保存** を優先する。初手の永続化は **ブラウザ内ローカル保存** で完結させ、共有リンク・動画保存・サーバー保存・アカウント同期は 6次のスコープに含めない。

保存対象は「星空を再現するための状態」に絞り、場所・日時・再生設定・視点・表示プリセット・プロジェクター補正などを候補とする。一方で、開いているパネル、自動非表示中かどうか、選択中の星や説明パネル状態などの一時 UI 状態は保存対象に含めない。

### Reasons

- 現在の Veluna で一番価値が高いのは「よかった空へすぐ戻れる」ことであり、共有や動画出力より個人利用の継続性に直結する
- ローカル保存なら D007 の「backend を急がない」方針を維持したまま実装できる
- 共有リンク・動画保存・サーバー保存は、認証・課金・公開・ストレージ・配布設計へ波及し、1フェーズ目の保存機能としては広すぎる
- UI の一時状態まで保存すると Product Principle 5「Calm by Default」に反して、再開時に雑多な UI を持ち越すリスクがある

### Consequences

- 6次 Task 2 以降は、保存用 state を既存の UI state から分離し、serialize / restore を中心に設計する
- 永続化の第一候補は `localStorage` とし、破損データや将来の schema 変更に備えて version 付きデータ形式を採用する
- 共有リンク、動画保存、サーバー保存は将来フェーズで別途 Small Spec を作成のうえ再検討する

---

## D021 — 7次は UI 拡張より先に、アカウント認証とクラウド同期の基盤を優先する

Status: Superseded by D022

### Decision

7次では、6次で追加した保存機能を複数端末で再利用できるようにするため、**アカウント認証** と **クラウド同期** を先に実装する。対象は、最後の状態から再開とお気に入りシーンの最小保存を同一アカウント内で共有できることに絞る。UI は最小限とし、見た目の整理や管理画面の作り込みは後回しにする。

初手のスコープは以下とする。

- サインイン / サインアウト / セッション復元
- 6次の保存シーンのクラウド保存
- 同一アカウントでの複数端末同期
- ローカル保存データの安全な移行

以下は 7次の初手に含めない。

- 共有リンク / シーン共有
- 課金
- 公開向けプロフィールや設定画面の作り込み
- アカウント削除や高度なアカウント管理

### Reasons

- 6次で保存モデルが整ったため、次の価値は「別端末でも同じ空に戻れること」にある
- 共有や課金より先に、個人利用の継続性を高める方が Product Vision に直結する
- UI を後で作り直す前提なら、先に sync contract とデータ破損耐性を固めた方が手戻りが少ない
- 共有・課金・公開設定まで同時に広げると、認証・権限・課金・サポートの論点が増え、初手として広すぎる

### Consequences

- 7次 Task 2 以降は、クラウド保存対象と同期ルールの型定義、認証セッション管理、ローカル保存からの移行を中心に進める想定だった
- UI は最低限の状態表示と操作導線だけを実装し、大きな設定画面や保存管理 UI は作らない想定だった
- その後、表示系を優先する方針に変更され、本 Decision は D022 に置き換えられた

---

## D022 — 7次は保存同期より先に、惑星・月・主要天体の表示を優先する

Status: Accepted

### Decision

7次では、保存同期やアカウント導入より先に、**惑星・月・主要天体の表示** を優先する。恒星中心で成立している現在の星空に、肉眼で存在感のある主要天体を追加し、表示体験そのものを一段進める。

初手のスコープは以下とする。

- 惑星の位置表示
- 月の位置表示
- 主要天体の最低限の見え方調整
- 既存の検索・選択・軽い情報表示への最小統合
- 恒星系と主要天体系の責務分離

以下は 7次の初手に含めない。

- アカウント認証
- 複数端末同期
- クラウド保存
- 共有リンク / シーン共有
- 課金
- UI の全面的な作り直し

### Reasons

- 現在のプロダクト価値は、まず「画面に見える空」を良くすることにある
- 惑星や月は、実際の夜空を眺める体験の自然な次段階であり、表示系優先という意図に合う
- 保存や同期は有用だが、主要天体が見えない状態で先に進めるより、表示対象を拡張した方が体験価値が高い
- UI は後で作り直す前提なら、今は見た目とデータ責務の整理を先に進める方が合理的

### Consequences

- 7次 Task 2 以降は、主要天体データソース、軌道計算、表示統合、最低限の情報導線を中心に進める
- 既存の星空描画 shader や恒星カタログ処理はできるだけ維持し、主要天体系を別責務で追加する
- アカウント認証、同期、クラウド保存は 8次以降で別途 Small Spec を作成のうえ再検討する

---

## D023 — 7次の主要天体計算には Astronomy Engine を採用し、対象は月と肉眼主要惑星に絞る

Status: Accepted

### Decision

7次の主要天体の位置計算には **Astronomy Engine** を採用する。初手の対象天体は **月・水星・金星・火星・木星・土星** に絞る。太陽、天王星、海王星、冥王星、衛星群、彗星、小惑星は 7次の初手に含めない。

主要天体系は既存の恒星系とは別責務にし、以下の 3 層へ分ける。

- astronomy runtime state
- render input
- search input

### Reasons

- Astronomy Engine の公式 README では、JavaScript で月と惑星の位置計算、見かけの等級、地平座標変換を扱え、ブラウザ向けに小さく高速で、精度はおおむね 1 arcminute 以内としている
- GitHub の LICENSE で MIT License が明示されており、将来の商用利用条件とも整合する
- 既存の `src/astronomy/coordinates.ts` は恒星の赤道座標から地平座標への変換には十分だが、惑星・月の軌道計算まで自前で拡張すると責務も検証負荷も急に重くなる
- 対象を月と肉眼主要惑星へ絞ることで、夜空体験への寄与が高いものから小さく進められる
- 太陽やさらに暗い外惑星まで同時に広げると、昼夜境界・表示抑制・明るさ表現・対象選定が一気に広がりすぎる

### Consequences

- Task 3 以降では Astronomy Engine を前提に adapter 層を追加し、Veluna 側の型へ変換する
- `src/celestialBodies/` を主要天体系の責務境界として使い、恒星データ・検索・情報表示とは必要最小限の接続だけを持たせる
- 7次の初手では主要天体検索も上記 6 天体の静的メタデータだけを扱う
- 太陽、天王星、海王星、冥王星、木星衛星などは将来フェーズで必要になった時点で再検討する

---

## D024 — 8次は公開機能より先に、認証とクラウド同期の最小基盤を優先する

Status: Accepted

### Decision

8次では、共有リンク・課金・公開向けアカウント管理より先に、**認証** と **クラウド同期** の最小基盤を優先する。初手の対象は以下とする。

- サインイン / サインアウト / セッション復元
- 6次で定義した保存シーンのクラウド保存
- 最後の状態から再開のクラウド同期
- 同一アカウントでの複数端末同期
- 既存のローカル保存データからクラウド保存への安全な移行

以下は 8次の初手に含めない。

- 共有リンク / シーン共有
- 課金
- 公開向けプロフィールや大規模な設定画面
- アカウント削除や高度なアカウント管理
- 詳細なプライバシー設定 UI

### Reasons

- 6次でローカル保存、7次で表示体験の拡張が完了し、次の価値は「どの端末でも同じ空へ戻れること」にある
- Product Vision はスマホ利用を前提としており、複数端末での継続利用を支える基盤は公開前に価値が高い
- 共有・課金・公開プロフィールまで同時に広げると、認証・権限・課金・公開設計が一気に結びつき、初手として広すぎる
- 同期対象を 6次で定義済みの「星空を再現するための状態」に限定すれば、既存の静かな体験を大きく壊さずに進めやすい

### Consequences

- 8次 Task 2 以降は、認証方式、同期データ契約、ローカル保存からの移行、最小 UI を中心に進める
- backend / auth provider / database の具体選定は 8次の初手で固定せず、Task 2 の調査結果を踏まえて決める
- 共有リンク、課金、公開向けアカウント管理は 9次以降で別途 Small Spec を作成のうえ再検討する

---

## D025 — 8次の旧案として、認証・同期基盤に Supabase Auth + Postgres を採用していた

Status: Superseded by D026

### Decision

8次の初手では、当時の案として認証・クラウド保存・複数端末同期の基盤に **Supabase Auth + Supabase Postgres** を採用していた。

初期のサインイン方式は **email magic link / OTP 系の passwordless sign-in** を第一候補とし、ソーシャルログインや複雑なアカウント設定は後回しにする。

同期対象の canonical payload は、6次で導入済みの `PersistedSceneStateV1` / `SavedSceneState` をそのまま使う。8次の初手では複数お気に入りシーン管理へ拡張せず、**単一の scene snapshot** をローカル・クラウドで共通に扱う。

### Comparison(2026-09-01 時点)

| 候補 | 構成 | 長所 | 懸念 |
|---|---|---|---|
| **Supabase** | Auth + Postgres + Realtime | Auth / DB / RLS が一体で、Web クライアントから最小構成で始めやすい。`SavedSceneState` を JSONB か列へ素直に保存できる。後で Postgres trigger / Realtime による複数端末反映へ広げやすい | RLS と権限設定を雑にすると危険。公開 schema の grant 設定を明示的に締める必要がある |
| Firebase | Authentication + Firestore | Web SDK が成熟しており、Auth 永続化と realtime listener が標準である | Firestore の document / rules 前提へ保存モデルを寄せる必要があり、Postgres より contract の厳密化と将来 migration が重い。server SDK は Security Rules を bypass するため運用境界を明確に保つ必要がある |
| Appwrite | Auth + Databases | Auth / session 永続化 / row permission が揃っている | Veluna の保存対象は複雑な document query より単純な user-owned state が中心で、現時点では Supabase より採用理由が弱い。将来の SQL 的な集計・監査・移行の柔軟性も Postgres に劣る |

### Reasons(At The Time)

- 商用利用を前提にした 8次の初手として、Auth と DB を別々に組み合わせるより、構成要素が少なく責務境界を作りやすい
- Supabase Auth は password / magic link / OTP / social login を持ち、初手は passwordless に絞ることで UI とアカウント復旧フローを最小化できる
- Supabase は Postgres + Row Level Security をそのまま使えるため、`user_id = auth.uid()` を基本に「本人の scene だけ読める / 書ける」を DB 側で閉じやすい
- 6次で定義済みの `PersistedSceneStateV1` は日時・場所・再生・視点・表示を 1 つの restorable snapshot として完結しており、Postgres の 1 row と相性がよい
- Firebase でも実装自体は可能だが、Firestore の query 制約と Security Rules の設計が contract と密結合しやすく、現在の「単一 snapshot を静かに同期する」要件には Supabase の方が過不足が少ない
- Appwrite も候補として成立するが、現時点の Veluna では「自分専用の 1 ユーザー 1 状態」を SQL / RLS で持てる Supabase の方が設計説明と検証が簡潔になる

### Sync Contract

- canonical payload は `src/save/sceneState.ts` の `PersistedSceneStateV1`
- 8次初手のクラウド保存単位は **1 ユーザー = 1 scene snapshot**
- クラウド側の最小レコードは以下を持つ
  - `user_id`
  - `scene_version`
  - `scene_payload`
  - `saved_at_iso`
  - `updated_at`
- `scene_payload` は `SavedSceneState` 相当の JSON とし、復元ロジックの正規化は引き続きアプリ側 `parsePersistedSceneState()` に集約する
- 8次では field-level merge を行わず、**snapshot 単位の last-write-wins** とする

### Migration / Merge Policy

- 未ログイン時は従来どおり `localStorage` を一次保存先とし、クラウド同期を必須にしない
- ユーザーが初回サインインした時点で、ローカルに有効な snapshot がありクラウドに未保存なら、その snapshot をクラウドへ移行する
- ローカルとクラウドの両方に snapshot がある場合は `savedAtIso` が新しい方を採用する
- `savedAtIso` が同値で payload が異なる場合は、tie-break としてクラウド側を正とし、その内容でローカルを上書きする
- オフライン・一時失敗時はローカル保存を継続し、ログイン済みかつ通信回復後に再同期する
- 8次初手では複数 snapshot の統合や field-level merge は扱わない

### Consequences(Archived)

- Task 3 以降は `auth state`、`sync state`、`scene snapshot repository` を分離し、既存 `src/save/` は local adapter と canonical serializer の責務へ寄せる
- Supabase の browser client は公開キーのみを使い、`service_role` はクライアントへ置かない
- DB 実装時は公開 schema の grants と RLS を明示的に設定し、`anon` と `authenticated` の権限を「必要な操作だけ」に絞る
- 8次の UI は email 入力 + sign-in state 表示程度の最小導線で成立させる。複数保存スロットやプロフィール画面は後続フェーズで再検討する

---

## D026 — 認証は Better Auth + PostgreSQL を前提にし、開発中はローカル DB を優先する

Status: Accepted

### Decision

認証基盤は **Better Auth + PostgreSQL** を第一候補とする。

ただし、開発段階では **外部 DB / 外部 Auth 前提で進めず、ローカル PostgreSQL を優先** する。Neon などの外部 PostgreSQL への配置は、本番・公開段階に入る時点で再検討する。

本番の目標構成は以下とする。

- Better Auth
- 自前運用または Neon 上の PostgreSQL
- 自前で選ぶメール送信基盤

### Reasons

- 将来的にはログイン機能が必要であり、DB 自体は必要になる見込みだが、開発初期から外部 DB / 外部 Auth サービスへ強く依存するのは不安が大きい
- Better Auth はフレームワーク本体が free and open source で、ユーザーデータを自分の PostgreSQL に保持できる
- Better Auth は PostgreSQL を直接利用でき、ローカル開発から本番構成へ段階的に移行しやすい
- 認証ライブラリ・DB・メール送信を分離しておく方が、将来の公開時にも構成の自由度を保ちやすい
- 8次の「クラウド同期を先に成立させる」前提は、現在の開発意図より一段先の運用判断を早く固定しすぎていた

### Consequences

- D025 の Supabase 前提は今後の forward plan としては採用しない
- 8次の Small Spec / 実装タスクは、クラウド同期前提から **ローカル PostgreSQL 上での認証基盤整理** を中心に見直す
- 複数端末同期は「将来候補」へ戻し、公開段階に入る時点で外部配置(Neon を含む)と合わせて再検討する
- 次の作業は、認証の初手スコープを `email+password` / `magic link` / `OTP` のどれで始めるかを含めて要件再整理すること

---

## D027 — 8次初手の認証方式は email + password とし、D025 時点の Supabase 実装は削除する

Status: Accepted

### Decision

8次の認証の初手方式は **email + password** とする。`magic link` / `OTP` は、メール送信基盤を導入した後の UX 改善候補として将来検討する。

D025 前提で実装していた Supabase ベースの認証・同期コード(`src/sync/`, `src/save/localSceneStore.ts`, `src/AccountSyncOverlay.tsx`, および `App.tsx` / `Starfield.tsx` からの配線、依存 `@supabase/supabase-js`)は削除する。「実験扱いで残す」「歴史的記録として残す」のいずれも取らない。

### Reasons

- D026 は「開発段階では外部 DB / 外部 Auth 前提で進めず、ローカル PostgreSQL を優先する」方針であり、`magic link` / `OTP` はメール送信基盤が動いていないとローカルでのサインインを一切テストできず、この方針と相性が悪い。`email + password` なら開発中はメール送信なしでサインアップ・サインイン・セッション復元を検証できる
- 削除した Supabase 実装のうち、実際にアプリへ配線されていたのは認証(`authClient.ts` / `AuthSessionProvider.tsx` / `AccountSyncOverlay.tsx`)のみで、`signInWithOtp` という OTP 前提の interface を持っていた。認証方式を `email + password` に変えるなら、この interface 自体を作り直す必要があり、実装を保持する再利用価値がない
- クラウド同期(`sceneRepository.ts` / `syncState.ts` / `sceneMigration.ts` / `supabaseSceneStore.ts` / `localSceneStore.ts`)は、当時から一度もアプリへ配線されておらず(各モジュール自身のテストからのみ参照)、D026 で複数端末同期そのものが「将来候補」へ戻ったため、動作対象のない speculative なコードとして残る理由がない
- Coding Rules の「不要な抽象化を作らない」「将来機能を先回りしない」に照らすと、Better Auth 実装時にどのみち作り直す認証 UI・型を保持し続けるより、削除して次回 Better Auth 前提で作り直す方が一貫している
- 判断の経緯自体は本 Decision と `docs/features/phase-8-implementation-tasks.md` の記録で追跡できるため、コードを残さなくても失われる情報はない

### Consequences

- `src/sync/` ディレクトリ、`src/save/localSceneStore.ts`、`src/AccountSyncOverlay.tsx` を削除し、`App.tsx` / `Starfield.tsx` / `displayState.ts`(`OverlayPanel` から `'account'` を除去)の配線を戻した
- `package.json` から `@supabase/supabase-js` を削除し、`package-lock.json` を更新した
- `docs/features/phase-8-implementation-tasks.md` の Task 3-8 は「実装したが削除済み」として記録を残し、Status は作業のやり直しが必要なことが分かる表記に更新する
- 次に 8次へ着手する際は、Better Auth + ローカル PostgreSQL + `email + password` を前提に Task 3 以降を再実装する

---

## D028 — 10次のスコープを確定する

Status: Accepted

### Decision

10次(`docs/features/phase-10-atmosphere-presets.md`)では、**雰囲気プリセットの方向性整理・設定可能な表示項目の棚卸し・他アプリにある表示切替系機能の振り分け・最小の設定 UI 方針・保存対象との接続整理** を扱う。認証・同期・課金(8次 / 9次 / 12次)、新規データ導入、大規模な設定画面の新規設計は 10次に含めない。

雰囲気プリセットの具体的な種類・数、他アプリ機能の振り分け表、設定 UI の最小構成は本 Decision では確定せず、`docs/features/phase-10-implementation-tasks.md` の Task 2 以降で個別に決める。

### Reasons

- `PRODUCT.md` の Current Phase と `DEVELOPMENT.md` の Phase Roadmap で、10次は既にこの内容として設定されている。Task 1 の主目的はこれを Small Spec として文書化し、Out of Scope を明確にすることだった
- 8次 / 9次 / 12次を後回しにする理由は「見た目・体験など目に見えてアプリの評価が決まる部分を先に実施し、認証・同期などのシステム面は後回しにする」という開発方針であり(`docs/features/phase-10-implementation-tasks.md` Notes)、10次はこの方針の実行そのものにあたる
- 5次で確立した鑑賞モード・UI 自動非表示・表現プリセット(`Planetarium-like` / `Gentle Contrast`)・プロジェクター向け表示補正を土台に、雰囲気の選択肢を増やすことは、新しい描画パスやデータソースを追加するより小さく進められ、既存の静けさを保ちやすい
- プリセットの具体的な種類・数や UI 構成は見た目・UX の結果が大きく変わる複数案があり、Task 1 の時点で先に固定するより、Task 2(棚卸し)を経てから Task 3 以降で個別に判断・確認した方がリスクが低い

### Consequences

- `docs/features/phase-10-atmosphere-presets.md` を Small Spec として新規作成した
- `docs/TASKS.md` / `DEVELOPMENT.md` / `PRODUCT.md` から新しい Small Spec への参照を追加した
- Task 2 以降は、まず既存実装(`starfieldConfig.ts` / `displayState.ts`)の設定可能項目の棚卸しから着手する

## D029 — 10次の雰囲気プリセットは表現プリセットを増やさず、夜間向け表示は独立の Night Mode UI とする

Status: Accepted

### Decision

10次(`docs/features/phase-10-atmosphere-presets.md` Task 3)では、以下で確定する。

- 表現プリセット(shader 側, `StarfieldVisualPreset`)は既存の `Planetarium-like` / `Gentle Contrast` の 2 種を維持し、新規追加しない。D019 で定めた「表現プリセットは最大 2 種」の上限は 10次でも据え置く
- 「夜間向け表示」は表現プリセットとは別の独立機能 `Night Mode UI` として 10次に追加する。対象は星の描画(shader・`starVisualAttributes`)ではなく、UI オーバーレイ(ボタン・パネルの配色・明るさ)のみとする
- `Night Mode UI` は既存の `applyOverlayAppearance(isProjectorMode)` / `overlayStyles.ts` の CSS 変数差し替えの仕組みを拡張して実現する方向とし、新しい描画パスは作らない
- 表現プリセットと `Night Mode UI` は独立した軸として扱い、併用可能とする

### Reasons

- D019 の「表現プリセット最大 2 種」は Product Principle 1(Planetarium-like First)を壊さないためのガードレールであり、10次時点でこれを緩める必要性(具体的な UX 上の不足)が確認されていない
- 「夜間向け表示」で解決したい課題は、就寝前などの利用で白っぽい UI が目に刺激的・没入感を妨げるという UI chrome 側の問題であり、星の見た目(shader)を変える必要はない。UI 側だけで完結させることで Principle 1 のリスクをそもそも発生させない
- プロジェクターモードで確立済みの「CSS 変数差し替えでオーバーレイ配色を切り替える」仕組みがそのまま流用でき、新しい描画パスやシェーダー変更を避けられる(Technical Direction: 新しい描画パスの再設計は行わない)

### Consequences

- `docs/features/phase-10-atmosphere-presets.md` に Task 3 の決定内容(各プリセットの UX intent、Principle 1 を壊さない範囲)を追記した
- `docs/features/phase-10-implementation-tasks.md` の Task 4(他アプリ機能の振り分け)では、「夜間モード」候補は本 Decision により 10次で扱うことが確定済みとして扱う
- `Night Mode UI` の具体的な配色値・適用範囲・UI 配置は Task 5(設定 UI の最小構成)で、保存対象への追加要否は Task 6 で扱う

## D030 — 表現プリセットを廃止し、設定パネルを新設する

Status: Accepted

### Decision

Task 9(`Night Mode UI` 実装)の Human Check を受け、表現プリセット(`Planetarium-like` / `Gentle Contrast`)を実際に見比べた結果、見た目の差が UI として選ぶ価値に見合わないと判断し、表現プリセット機能を廃止する。今後の描画基準は `Planetarium-like` の値(D011「プラネタリウム基準」)に固定した単一のベースラインとし、ユーザーが切り替えられる「表現プリセット」という概念自体を持たない。

D019 の「表現プリセットは最大 2 種」、D029 の「表現プリセットは既存 2 種を維持し新規追加しない」は本 Decision により前提が失効する(プリセット自体が存在しなくなるため)。両 Decision は撤回ではなく、それぞれの時点での判断記録として残す。

あわせて、D009(将来の設定 UI はオーバーレイ方向)の実装として初めての本格的な設定パネル(`src/SettingsOverlay.tsx`)を新設する。対象はプロジェクター補正・夜間モード UI の 2 項目に限定する。鑑賞モード(`ImmersiveModeToggle`)は使用頻度が高く一回タップで完結すべき独立操作という判断から、意図的にパネルの外に残し、これまでどおり単独の常時表示トグルボタンとする。

### Reasons

- 表現プリセットは 2 種の差分が小さく(背景色・halo・milkyWay・horizon・constellationLines の軽微な調整のみ)、Human Check で「違いが分かりにくく UI として選ぶ価値が薄い」と判断された
- D011 のプラネタリウム基準は単一の確立済みルック(Human Check 承認済み)であり、複数プリセットを維持するコストに見合う UX 価値が実証されなかった
- D009 は「設定 UI はオーバーレイ方向」という方向性のみを定め、詳細は将来決めるとしていた(D009 Not Decided)。プロジェクター補正・夜間モード UI という具体的な 2 項目が揃った時点で、最小の設定パネルとして初めて具体化する
- 鑑賞モードは D019 で「通常利用でも使う」高頻度機能と位置付けられており、パネルに格納すると一回タップで済んでいた操作が二段階操作になり体験が悪化するため、意図的にパネル外へ残す

### Consequences

- `src/stars/starfieldConfig.ts` から `StarfieldVisualPresetKey` / `StarfieldVisualPreset` / `presets` / `resolveStarfieldVisualPreset` を削除した。トップレベルの `render`/`milkyWay`/`horizon` の値は既存の `planetarium-like` 相当のまま変更していない(削除のみで数値変更なし)
- `src/VisualPresetOverlay.tsx` を削除した
- `src/displayState.ts` から `visualPreset` / `setVisualPreset` を削除し、`OverlayPanel` に `'settings'` を追加した
- `src/ProjectorModeToggle.tsx` / `src/NightModeUiToggle.tsx` を削除し、`src/SettingsOverlay.tsx` に統合した
- `src/save/sceneState.ts` から `visualPreset` 関連のフィールド・検証を削除した。`PERSISTED_SCENE_STATE_VERSION` は 1 のまま(既存の保存データに `visualPreset` キーが残っていても無視されるだけで読み込みは成功する)
- D019 の「表現プリセット」実装フェーズ、D029 の「表現プリセット維持」判断は本 Decision で上書きされる過去の記録として残る

## D031 — プロジェクター投影時のブラウザ chrome 対策として、フルスクリーン表示と iOS 向け PWA ホーム画面起動を追加する

Status: Accepted

### Decision

D030 で新設した設定パネルに、フルスクリーン表示トグルを追加した(`document.requestFullscreen()` / `exitFullscreen()`)。Fullscreen API 非対応環境(iOS Safari が該当)ではボタンごと非表示にする。

iOS Safari は `<video>` 以外の要素で Fullscreen API 自体をサポートしないため、フルスクリーントグルだけでは iPhone でのミラーリング投影時にブラウザの chrome(アドレスバー等)を消せない。対策として `index.html` に `manifest.json` / `apple-touch-icon` / `apple-mobile-web-app-capable` 等の PWA メタタグを追加し、ユーザーがホーム画面に追加して起動した場合は chrome なしの standalone 表示になるようにした。

### Reasons

- ユーザーからプロジェクターへのミラーリング投影時にブラウザ chrome が投影像を圧迫するという実利用上のフィードバックがあり、確認したところ利用環境は iPhone の Safari だった
- iOS Safari の Fullscreen API 非対応は OS 側の制約であり、Web 技術側で回避できるのは「ホーム画面に追加して起動する」という PWA の standalone 表示のみ
- ホーム画面追加はユーザーの手動操作が必要(iOS に自動プロンプト API はない)だが、一度行えば以降はアイコンタップのみで chrome なし起動になり、恒久的な解決になる

### Consequences

- `public/manifest.json` を新設(`display: standalone`)
- `scripts/generate-app-icons.mjs` を新設。`public/favicon.svg` を元に headless Chromium(Playwright、既存の e2e 依存を流用)でホーム画面アイコン(180/192/512px PNG)を `public/icons/` に生成する
- `index.html` に PWA 関連メタタグと `apple-touch-icon` を追加
- フルスクリーン状態はブラウザ主導(Esc 等)で変わりうるため `displayState.ts` の純粋トグル群には含めず、`Starfield.tsx` のローカル state + `fullscreenchange` イベント購読で管理する。`SavedSceneState` にも含めない(D020 の一時 UI 状態除外方針を踏襲)
- 追加対応として、モバイルブラウザ共通の「スクロールでアドレスバーが自動収縮する」挙動を起動時に自動発火させる実装を加えた(`src/index.css` の `body { min-height: calc(100% + 1px) }` で1px分の余白を作り、`Starfield.tsx` のマウント時 `window.scrollTo(0, 1)` で発火。`orientationchange` でも再発火)。ブラウザの種類を問わず自動で効く、操作不要のベースライン対策

### Known Limitation(重要・未解決)

**iOS 上で Safari 以外のブラウザ(Chrome for iOS, Yahoo!ブラウザ等)からアクセスした場合、chrome を完全に消す手段が存在しない。** iOS では全ブラウザが WebKit エンジンを使う規約上の制約があり、かつ「ホーム画面に追加してもchromeなしで起動する」standalone 機能は Safari のみが提供する OS 連携であるため、Web 技術側での代替手段はない(Web 公開後、実際に使われるブラウザは Safari に限定できない)。

- Android / PC: フルスクリーンボタンで完全に解決する(対応済み)
- iPhone + Safari: ホーム画面追加で完全に解決する(対応済み、ユーザーの手動操作が必要)
- iPhone + Safari 以外のブラウザ: 上記のアドレスバー自動収縮のみが効き、chrome を完全には消せない(未解決)

この制約は Product の「プロジェクター投影での利用」という利用シーンに直接影響するため、後で「もっと良い対策はないか」を再検討する際は、まずこの記録を確認すること。既知の代替案(canvasを`<video>`化してネイティブ動画フルスクリーンを流用する等)はインタラクティブ操作(ドラッグ視点操作・タップでの星選択)を破壊するため不採用と判断済み。

## D032 — 11次より先に13次へ着手し、スコープを星座絵表示のみに絞る

Status: Accepted

### Decision

Phase 10 完了後、次フェーズの着手順を「11次(音楽/リラクゼーション拡張)→13次(天文拡張機能)」から**13次を先**に変更する。理由は、13次の項目の方が見た目・鑑賞体験に直接関わり、11次(新しいドメインである音楽)より Product Principle 3(Star Rendering Is the Foundation)の延長で評価しやすいため。

13次のスコープは、Phase 10 Task 4(`docs/features/phase-10-atmosphere-presets.md`)で振り分けた 6 候補のうち **星座絵表示(星座の絵柄オーバーレイ)のみ** とする。残り 5 候補は 13次からも外し、対象外とする。

- 星座線の常時表示化: 対象外(D017 の Calm by Default を覆す変更のため、必要になった時点で改めて Small Spec)
- ラベル量調整: 対象外(独立機能としてスコープ確定が必要なため見送り)
- 地平線 / グリッド / 方位表示: 対象外(Principle 2 との相性が悪いという Phase 10 の判断を維持)
- AR / センサー系: 対象外(D014・0次 Out of Scope と矛盾するため見送り)
- イベント / 衛星 / 観測支援: 対象外(観測支援ドメインで Principle 2 と相性が悪いため見送り)

星座絵表示は新しい画像アセットの導入を伴うため、Product Principle 7(商用利用可否)の確認が実装前の必須ゲートとして残る。アセットの具体的な入手元・ライセンスは本 Decision では決めず、13次の Task の中で改めて人間に確認する。

### Reasons

- ユーザーから「13次の方が見た目に関わるから優先したい」との明確な意思表示があった
- 6候補のうち星座絵表示以外は、既存 Decision(D014, D017)や Product Principle 2 と正面から矛盾するか、独立したスコープ確定が必要と Phase 10 Task 4 で既に整理済みであり、13次でも同じ判断を維持するのが一貫している
- 星座絵表示は新規ビジュアル要素の追加ではあるが、既存の「星座線・星座名を選択時のみ表示」という Calm by Default の枠組みの中に収まる拡張であり、他候補ほど原則との衝突が大きくない

### Consequences

- `docs/TASKS.md` の Phase Task Files で 13次を進行中とし、11次より着手順を先にする
- `PRODUCT.md` の Current Phase を 13次へ更新する
- `docs/features/phase-13-constellation-art.md`(Small Spec)・`docs/features/phase-13-implementation-tasks.md`(詳細タスク)を新規作成する
- 星座絵アセットの入手元・ライセンス確認は 13次の実装タスクの中で改めて人間へ確認する(未決定のまま実装に入らない)

## D033 — 星座絵アセットは Stellarium 標準星座絵(Johan Meuris 作)を採用する

Status: Accepted

### Decision

13次(星座絵表示)で使う星座絵アセットとして、[stellarium-skycultures](https://github.com/Stellarium/stellarium-skycultures) リポジトリの `western` スカイカルチャーに含まれる星座絵(Johan Meuris 作、85 ファイルで IAU 88 星座相当をカバー)を採用する。形式は配布されている WebP 画像をそのまま使い、自作 SVG 化は行わない。

### Comparison

| 候補 | ライセンス | 商用利用 | 特徴 |
|---|---|---|---|
| **Stellarium 星座絵(Johan Meuris)** | Free Art License(`western/description.md` の License セクションに明記) | 明示的に可(コピーレフト。改変版を配布する場合は同ライセンス継承 + 作者クレジット必須) | グレースケール単色の絵柄(サンプル: Orion を目視確認済み)。画像ごとにピクセル座標⇔Hipparcos 星番号のアンカーデータが付属し、位置合わせに使える |
| パブリックドメイン古典星図(Urania's Mirror 等) | パブリックドメイン | 制約なし | 彩色版画で装飾過多。Calm by Default から外れるリスクが高く、位置合わせ用メタデータも無いため星座ごとの手作業が必要 |
| 自作ミニマル SVG | 自社著作物 | 制約なし | ライセンスリスクはゼロだが、89 レコード分を新規に描き起こす工数が大きい |

### Reasons

- Free Art License は `western/description.md` に正式なライセンス表記があり、D015(d3-celestial 採用)と同じ「商用利用可否が明確な情報源を優先する」基準(Product Principle 7)を満たす
- IAU 88 星座相当を実質カバーしており、Astraloom の 89 レコード(Serpens 分割・Argo Navis 分割込み)との対応も、Stellarium 側が同じ理由で画像を共有していることを確認済み(1星座絵が複数レコードにまたがるケースがある点は Task 3 の統合設計で扱う)
- 画像ごとのアンカーデータ(ピクセル座標⇔Hipparcos 星番号)により、d3-celestial の星座線を HYG id へマッチングした前例(D015)と同様、座標近傍マッチングで Astraloom の星カタログへ位置合わせできる見込みが立った
- サンプル画像(Orion)を実際に目視し、グレースケール単色・透過背景で、低不透明度オーバーレイに向く絵柄であることを確認した

### Consequences

- 星座絵を配布物に含める場合、Johan Meuris のクレジット表記が必要(Free Art License の要件)。クレジット表示箇所は Task 3(表示条件・統合設計)で決める
- 画像は Hipparcos 星番号ベースのアンカーを持つが、Astraloom の `HygStarRecord` は現状 Hipparcos 番号を保持していないため、Task 4(描画実装)で座標近傍マッチングによる変換が必要になる
- 1つの星座絵が複数の IAU 星座レコードにまたがるケース(旧 Argo Navis → Carina/Puppis/Vela/Pyxis 等)があるため、Task 3 で `ConstellationRecord` との対応関係を設計する
