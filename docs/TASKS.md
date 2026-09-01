# Task Index

このファイルは、プロジェクト全体の実装タスクを確認するための入口とする。
具体的な作業内容と詳細な進捗は、各フェーズのタスクファイルで管理する。

## Current Status

- Current phase: Phase 10
- Next task: Task 1 — 10次スコープ確定 + Small Spec 作成
- Detail file: [`phase-10-implementation-tasks.md`](features/phase-10-implementation-tasks.md)

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
| Phase 10 — 雰囲気プリセット / 表現設定 | In Progress | [`phase-10-implementation-tasks.md`](features/phase-10-implementation-tasks.md) |
| Phase 11 — 音楽 / リラクゼーション拡張 | Planned | これから作成 |
| Phase 12 — 同期 / 共有 | Candidate | これから作成 |
| Phase 13 — 天文拡張機能 | Planned | これから作成 |

## Status Rules

- `Not Started`: 未着手
- `In Progress`: 作業中、または Human Check などの完了条件が残っている
- `Done`: 詳細ファイルに記載された Acceptance Criteria を満たしている

タスクを完了した場合は、まず詳細ファイルの `Status` とチェック項目を更新し、
フェーズ内の次タスクへ進む。フェーズ内の全タスクが `Done` になったら、このファイルの
該当フェーズも `Done` に更新する。
