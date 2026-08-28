---
name: ferry-pr
description: Use this skill when opening or managing ANY pull request in the ferry repo. Produces the standard rich PR body (Summary, Type of Change, Changes, Commit map, Why, Related Issues, How to Test, Checklist), applies labels (type + size/S-M-L) and assignee, waits for the build and e2e checks, and merges with gh pr merge --merge --delete-branch. Trigger whenever a branch is ready for review.
---

# Ferry PR — pull request conventions

`main` is protected: the `build` check must pass, and the `e2e` workflow also
runs on every PR. Never merge red.

## Open the PR

1. Push the branch, then write the body to a temp file (avoids shell quoting
   issues with backticks/apostrophes), or use a quoted heredoc:
   `--body "$(cat <<'EOF' ... EOF)"`
2. Create it:

```bash
gh pr create --base main \
  --title "<type>(<scope>): <imperative summary>" \
  --body-file /tmp/ferry-pr-body.md \
  --label <type-label> --label size/<S|M|L> \
  --assignee Cleverprogramer
```

## Body sections (in order)

- `# <emoji> <type>(<scope>): <summary>` — title-style heading
- `## Summary` — 2-3 sentences of real context
- `## Type of Change` — checkbox list (Feature / Fix / Refactor / Docs /
  Infra / Performance); check what applies
- `## Changes` — bullets grouped from the ACTUAL commits only; never
  fabricate
- `### Commit map` — table mapping each commit to its theme
- `## Why` — motivation
- `## Related Issues` — `Closes #N` when the PR completes the issue
- `## How to Test` — concrete numbered steps a reviewer can follow
- `## Checklist` — builds locally / test coverage / self-reviewed /
  conventional commits / CI passing

## Labels

- Type: `enhancement`, `bug`, `documentation`, `testing`
- Size (from commit count): `size/S` (1-3), `size/M` (4-8), `size/L` (9+)
- Always add assignee `Cleverprogramer`

## Wait, verify, merge

1. `gh pr checks <n>` — wait for `build` AND `e2e` to pass.
2. `gh pr merge <n> --merge --delete-branch`
3. `git checkout main && git pull`
4. Confirm the linked issue auto-closed (`Closes #N` in the PR body).

## Hard rules

- Never merge with failing checks; fix on the same branch and push.
- Never fabricate changes, test steps, or issue numbers — every bullet must
  trace to a real commit.
- Base is always `main` (there is no staging branch).
- Size label must match the final commit count — relabel if commits were
  added during review.
