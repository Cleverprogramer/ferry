---
name: ferry-ship
description: Use this skill for ANY code change in the ferry repo (feature, fix, docs, infra, test). It is the end-to-end delivery loop — create an issue, branch off main, implement in small tested chunks, commit with ferry-commit conventions, open a PR with ferry-pr conventions, wait for CI + E2E to pass, then merge and verify the issue auto-closes. Trigger on any request to "add", "fix", "implement", or "ship" something in this repo.
---

# Ferry Ship — the delivery loop

The one true workflow for every change in this repository. Never commit directly to
`main`; it is protected (CI `build` check is required, PRs only).

## The loop

1. **Issue first.** Before touching code:
   `gh issue create --title "<type>: <what>" --body "<summary + scope + acceptance criteria>"`
   Every change needs an issue, even chores and docs.

2. **Branch off updated `main`.**
   `git checkout main && git pull && git checkout -b <type>/<short-slug>`
   - Types: `feat/`, `fix/`, `chore/`, `ci/`, `docs/`, `test/`, `build/`
   - Slug: 2-4 words, kebab-case, describes the change (e.g. `feat/copy-json`)

3. **Implement in small logical chunks.** One related group of sub-features per
   commit — never one giant change. After each chunk, run locally:
   - `bun test` (unit, must stay green)
   - `bun run build` (must stay green; also refreshes `dist/` for size checks)
   - `bun run lint && bun run format:check`
   - For UI/playground changes: `bun run test:e2e`

4. **Commit each chunk with the `ferry-commit` skill** (Conventional Commits,
   issue references). Commitlint runs on `commit-msg` (subject ≤ 72 chars, body
   lines ≤ 100 chars) and lint-staged auto-fixes staged files on `pre-commit` —
   if it rewrites files, `git add -A` and amend/re-commit.

5. **Push the branch:** `git push -u origin <branch>`.

6. **Open the PR with the `ferry-pr` skill** (title, body sections, labels,
   size label, assignee).

7. **Wait for checks to pass:** `gh pr checks <n>` — both `build` (lint,
   format, build, publint, attw, size budget, coverage) and `e2e` must be
   green. Fix and push if red; never merge red.

8. **Merge:** `gh pr merge <n> --merge --delete-branch`, then
   `git checkout main && git pull`. Verify the issue auto-closed via the
   `Closes #N` reference.

## Hard rules

- Never push to `main` directly; never merge with red checks.
- Never fabricate test results, commits, or issue numbers.
- One PR per feature/fix; one logical change per commit.
- `npm publish` is intentionally deferred — do not add publish steps.
- If CI fails on the PR, fix on the same branch and push; the PR updates.
