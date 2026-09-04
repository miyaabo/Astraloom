# Task Index

このファイルは、プロジェクト全体の実装タスクを確認するための入口とする。
具体的な作業内容と詳細な進捗は、各フェーズのタスクファイルで管理する。

## Current Status

- Current phase: Phase 13(D032: 11次より先に着手。スコープは星座絵表示のみ)
- Next task: Phase 13 Task 4(星座絵の描画実装)は絵柄が2回却下され、描画コードは撤去済み(型定義・投影ロジックのみ残存)。人間が外部AIで画像を生成し、Claude 側でアンカー配置する方向を検討中。詳細は `phase-13-implementation-tasks.md` の Task 4 を参照
- Detail file: [`phase-13-implementation-tasks.md`](features/phase-13-implementation-tasks.md)
- Small Spec: [`phase-13-constellation-art.md`](features/phase-13-constellation-art.md)
- 参考: プロジェクター投影時のブラウザ chrome 対策(iOS Safari 以外)が未解決のまま残っている(`DECISIONS.md` D031)。着手するなら別タスクとして起票してから

作業を開始するときは、対象フェーズの詳細ファイルを開き、上から最初に
`Status` が `Done` でないタスクだけを実施する。

## Phase Task Files

| Phase | Status | Task file |
|---|---|---|
| Phase 0 — 星空表示 | Done | [`phase-0-implementation-tasks.md`](features/phase-0-implementation-tasks.md) |
| Phase 1 — 実際の星空 | Done | [`phase-1-implementation-tasks.md`](features/phase-1-implementation-tasks.md) |
| Phase 2 — 再生・視点操作 | Done | [`phase-2-implementation-tasks.md`](features/phase-2-implementation-tasks.md) |
| Phase 3 — 星座・星の知識 | Done | [`phase-3-implementation-tasks.md`](features/phase-3-implementation-tasks.md) |
| Phase 4 — リラクゼーション体験 | Done | [`phase-4-implementation-tasks.md`](features/phase-4-implementation-tasks.md) |
| Phase 5 — 表示体験の整理 | Done | [`phase-5-implementation-tasks.md`](features/phase-5-implementation-tasks.md) |
| Phase 6 — 保存・出力 | Done | [`phase-6-implementation-tasks.md`](features/phase-6-implementation-tasks.md) |
| Phase 7 — 惑星・月・主要天体の表示 | Done | [`phase-7-implementation-tasks.md`](features/phase-7-implementation-tasks.md) |
| Phase 8 — 認証・DB保存 | Planned | [`phase-8-implementation-tasks.md`](features/phase-8-implementation-tasks.md) |
| Phase 9 — 保存体験の拡張 | Planned | これから作成 |
| Phase 10 — 雰囲気プリセット / 表現設定 | Done | [`phase-10-implementation-tasks.md`](features/phase-10-implementation-tasks.md) |
| Phase 11 — 音楽 / リラクゼーション拡張 | Planned(13次より後回し, D032) | これから作成 |
| Phase 12 — 同期 / 共有 | Candidate | これから作成 |
| Phase 13 — 天文拡張機能(星座絵表示) | In Progress | [`phase-13-implementation-tasks.md`](features/phase-13-implementation-tasks.md) |

## Status Rules

- `Not Started`: 未着手
- `In Progress`: 作業中、または Human Check などの完了条件が残っている
- `Done`: 詳細ファイルに記載された Acceptance Criteria を満たしている

タスクを完了した場合は、まず詳細ファイルの `Status` とチェック項目を更新し、
フェーズ内の次タスクへ進む。フェーズ内の全タスクが `Done` になったら、このファイルの
該当フェーズも `Done` に更新する。
