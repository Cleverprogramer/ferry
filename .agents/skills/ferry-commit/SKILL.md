---
name: ferry-commit
description: Use this skill when writing ANY commit message in the ferry repo. Produces Conventional Commits that pass the repo's commitlint config (subject <= 72 chars, body lines <= 100 chars, imperative mood) with issue references. Trigger on every git commit — pair with the ferry-ship loop.
---

# Ferry Commit — commit conventions

Commitlint (`@commitlint/config-conventional`) enforces these on `commit-msg`.
lint-staged runs `prettier --write` + `eslint --fix` on staged files during
`pre-commit` — if it modifies files, `git add -A` and commit again.

## Format

```
<type>(<scope>): <imperative subject>

- <what changed bullet>
- <why / notable detail bullet>

<Refs|Fixes|Closes> #<issue>
```

## Rules

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore` (+ optional scope from the affected area, e.g.
  `feat(clipboard):`).
- **Subject:** imperative mood, no trailing period, <= 72 chars.
- **Body bullets:** one line each, <= 100 chars (commitlint
  `body-max-line-length` rejects longer lines — wrap or split into
  multiple `-m` flags).
- **Issue refs:** use `Fixes #N` when the commit completes the issue (auto-
  closes on merge to `main`), `Refs #N` when it only partially advances it.
- **One logical change per commit.** If the staged diff mixes unrelated
  changes, unstage and split first.

## Ready-to-run command form

Use one `-m` per paragraph so copy-paste is always safe:

```bash
git commit -m "feat(clipboard): add copyJson convenience" \
  -m "- Serialize any value to JSON and copy it, with optional pretty printing" \
  -m "- INVALID_PAYLOAD rejection for unserializable values" \
  -m "- 3 unit tests; README documents the helper" \
  -m "Fixes #15"
```

Trivial one-liners stay bare: `git commit -m "docs: fix typo in README"`.
