# Phase 2 — Time Playback

## Status

Done。Automated / Technical Acceptance Criteria、Human Check とも完了(`docs/features/phase-2-implementation-tasks.md` Task 8 参照)。

前フェーズ: `docs/features/phase-1-real-sky.md`(Done)。1次で確立した「指定した場所・日時の星空を正しく再現する」機能を土台にする。見た目のレイヤー(shader・config)は変更しない前提で進める(D003)。

## Goal

実際の星の動きを、好きな速度で再生・停止・巻き戻ししながら眺められるようにする。

1次は「ある瞬間の星空を正しく再現できること」がゴールだった。2次では、その瞬間を時間軸上で連続的に動かし、「星の動きをぼーっと眺める」という Product Vision の中核体験に近づける。

球面表示・視点移動・ズームも 2次の対象とする。これは Playback 体験(特に長時間の再生)において、平面表示のまま天頂中心の円形投影だけで見続けるより、実際の空を見上げているような没入感が必要になると想定されるため(要人間確認、Questions 参照)。

## Background / Reference

- `PRODUCT.md` — Product Vision、Future Capability Inventory: Playback / View・Rendering
- `DEVELOPMENT.md` — Phase Roadmap: 2次
- `DECISIONS.md` — D003(見た目と位置計算の分離、球面表示への拡張余地)、D004(表現設定の一元管理)、D006(モバイル品質)、D009(オーバーレイ方向の設定UI)
- `docs/features/phase-1-real-sky.md` — 1次 Small Spec(完了)。天文座標変換・実データ接続はここで完成済み

## Scope

- 再生／停止
- 再生速度設定(等倍・倍速など)
- 巻き戻し(時間を逆方向に進める)
- 球面表示(D003 で温存してきた拡張ポイント)
- 視点移動
- ズーム
- 表示・時間・場所オーバーレイの UI 整理(Playback 用コントロールが増えるため)
- スマホ負荷への自動品質調整(再生時のフレーム負荷を踏まえた再検討)

## Out of Scope(2次では作らない)

- 星座線・星座名・星情報・検索 — 3次
- 天の川・地平線・風景 — 4次
- BGM・環境音 — 4次
- スリープタイマー・自動 UI 非表示・終了時フェード・表現プリセット — 4次
- お気に入り・保存・共有・動画出力 — 5次
- アカウント・課金 — 6次/7次
- 時間範囲(開始/終了時刻)の高度な指定 UI — まず単純な再生/停止/速度/巻き戻しを成立させることを優先し、必要になった時点で Small Spec を追加検討する

## Technical Direction

- 再生は既存の `date` state を一定間隔で連続的に進める形で実装できる見込み。星データの再計算・再描画は 1次で実装済みの `Starfield.handleDateChange` → `generateRealStarData` → `StarfieldRenderer.updateStars` の経路を流用する
- 球面表示は、星の「位置計算」(alt/az までは 1次の `src/astronomy/coordinates.ts` をそのまま使える)と「画面へのマッピング」(現状は `src/stars/skyProjection.ts` が平面専用)を分離した設計(D003)により、`skyProjection.ts` 相当の層だけを球面用に差し替え/追加すれば実現できる想定
- 視点移動・ズームを扱うには、現状の `THREE.OrthographicCamera` では表現力が不足する可能性があり、`PerspectiveCamera` への変更要否を Task 開始時に調査する
- 再生中は毎フレーム全星のデータを再計算するとモバイルで負荷が高くなる可能性がある。再計算頻度(間引き/スロットリング)は計測のうえで判断する(CLAUDE.md「最適化は計測に基づいて行う」)

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- 再生速度に応じて時間が正しく進行し、星の alt/az が既存の座標変換ロジックと整合することを unit test で確認する
- console error なし

### Human Check

- 再生時の星の動きが自然に見える(速すぎない、カクつかない)
- 球面表示に切り替えても、0次/1次で確立した見た目の品質(サイズ感・明暗階層・グロー・色味)が維持されている
- 視点移動・ズームがプラネタリウム体験の落ち着きを壊さない
- PC・スマホ縦画面で破綻しない
- スマホでの再生時に体感できる FPS 低下・発熱等がない

## Questions Claude May Ask

- 球面表示は 1次の平面表示を完全に置き換えるか、切替可能な形で共存させるか(見た目/UX が大きく変わるため実装前に確認)
- 視点移動の入力方法(ドラッグ、ジャイロセンサー、ボタン操作など)
- カメラを Perspective へ変更する必要があるかどうかの技術判断
- 再生速度の初期プリセット(等倍・数十倍・数百倍など、どの範囲を用意するか)

小さな実装詳細では質問せず、合理的に判断して進める。
