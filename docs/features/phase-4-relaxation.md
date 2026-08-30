# Phase 4 — Relaxation Experience

## Status

Task 1(スコープ確定)完了(D018)。4次のスコープは **天の川・地平線/風景**(既存 shader の拡張)に確定した。Sound 等の他候補は今回のスコープに含めない。Task 2 以降の実装はこれから。

前フェーズ: `docs/features/phase-3-star-knowledge.md`(Done)。1次〜3次で確立した「実際の星空を、時間を流しながら眺め、興味を持てば星・星座を知れる」体験を土台にする。

## Goal

星空を自分好みのリラックス空間にできるようにする。

1次〜3次は「正しい星空を再現し、時間を流しながら眺め、興味を持てば知れる」体験を確立した。4次では、天の川・地平線/風景を加えて夜空の映像的な深みを増やす(D018)。ただし Product Principle 1(Planetarium-like First)・2(Relaxation Over Information Density)・5(Calm by Default)は維持し、追加要素が星空そのものより目立たないようにする。

## Background / Reference

- `PRODUCT.md` — Product Principle 1/2/5/6/7、Future Capability Inventory: View / Rendering
- `DEVELOPMENT.md` — Phase Roadmap: 4次
- `DECISIONS.md` — D004(表現設定の一元管理)、D011(プラネタリウム基準)、D017(選択時のみ表示 = Calm by Default の実例)、D018(4次スコープ確定)
- 既存コード: `src/stars/starfieldConfig.ts`(表現パラメータの一元管理)、`src/render/`(星 shader・renderer)

## Scope(Task 1 で確定 — D018)

- **天の川**: 既存の星 shader の延長(パーティクル/シェーダー手法での密度・グロー表現)で実装する
- **地平線/風景**: 同じく既存 shader の延長で、シンプルな形状/グラデーションとして表現する

画像アセットは使用しない。

### Scope Candidates のうち今回は扱わないもの

DEVELOPMENT.md / PRODUCT.md の 4次候補一覧のうち、以下は今回のスコープに含めない(将来フェーズで再度スコープ確定のうえ検討する)。

- Sound(内蔵 BGM、環境音、音量／ミュート、ユーザー音楽ファイル読み込み、プレイリスト、リピート／シャッフル)
- View / Rendering のうち天の川・地平線/風景以外(Natural / Planetarium-like などの表現プリセット、夜空背景プリセット、プロジェクター向け表示補正)
- Playback / Session(スリープタイマー、自動 UI 非表示、終了時フェード)

## Out of Scope(4次では作らない)

- お気に入り・保存・共有・動画出力 — 5次
- アカウント・課金 — 6次/7次
- 惑星・月・代表的天体の位置表示 — 引き続き対象外(D016)。天の川は星の位置計算とは別の表現要素のため、この対象外の対象には含めない
- 星座線・星座名・星名・検索・星情報の追加変更 — 3次で完成済み(Done)。このフェーズでは触らない
- Sound / 天の川・地平線以外の View・Rendering プリセット / Playback・Session のタイマー系 — 今回はスコープに含めない(上記参照)

## Technical Direction(D018)

- **天の川 / 地平線・風景**: 既存の星 shader の延長で実装する。画像アセットは使用しないため、ライセンス確認は不要
- 星の位置計算(`src/astronomy/`, `src/stars/skyProjection.ts` 等)・カメラ/再生エンジン(`src/render/`, `src/playback/`)には手を入れない。天の川・地平線は星と同じ描画パイプライン上に追加する表現要素として扱う

## Acceptance Criteria

### Automated / Technical

- typecheck / lint / unit test / production build が成功する
- 天の川・地平線の shader パラメータ・生成ロジックを unit test で確認する
- console error なし

### Human Check

- 天の川・地平線/風景が Product Principle 1/2/5 を壊していない(星空が主役であり続ける)
- プラネタリウム基準(D011)から大きく外れていない
- PC・スマホで破綻しない

## Questions Claude May Ask

Task 1 は完了済み(D018)。Task 2 以降で新たに判断が必要な大きな論点が出た場合は、CLAUDE.md の Question Policy に従って個別に確認する。
