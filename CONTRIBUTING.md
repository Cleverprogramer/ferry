# Contributing to ferry 🚢

Thanks for helping! This repo runs a strict but simple workflow — issue first,
conventional commits, changesets, rich PRs — and CI enforces the message
conventions for you.

## The workflow at a glance

```
issue → branch → commits (conventional) → PR (rich body) → checks → merge
                                       └→ changeset → auto release
```

1. **Open an issue first** describing the feature or fix — use the templates
   (bug report / feature request). Reference it from every commit.
2. **Branch** from `main`: `feat/<area>-<thing>`, `fix/<thing>`,
   `docs/<thing>`, `chore/<thing>`.
3. **Commit** following [Conventional Commits](#commits) — one logical change
   per commit.
4. **Add a changeset** (`bunx changeset`) when the package surface changes.
5. **Open a PR** using the template, wait for all checks, merge.

## Commits

The `commit-msg` hook (commitlint) validates every message, and the CI
**messages** job validates the PR title plus every commit in the branch.

```
<type>(<scope>): <imperative subject>

- <what changed bullet>
- <why / notable detail bullet>

<Refs|Fixes|Closes> #<issue>
```

- **Types:** `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci`
  `chore`
- **Scopes (warned if outside the list):** `core` `clipboard` `react` `vue`
  `svelte` `playground` `release` `ci` `deps` `tests` `size` `agents`
- **Subject:** imperative mood, no trailing period, ≤ 72 chars
- **Body bullets:** one line each, ≤ 100 chars
- **Issue refs:** `Fixes #N` completes the issue (auto-closes on merge);
  `Refs #N` advances it partially. Auto-generated merge commits are ignored.

```bash
git commit -m "feat(clipboard): add copyJson convenience" \
  -m "- Serialize any value to JSON and copy it, with optional pretty printing" \
  -m "- INVALID_PAYLOAD rejection for unserializable values" \
  -m "- 3 unit tests; README documents the helper" \
  -m "Fixes #15"
```

## Pull requests

The PR template mirrors the review order: Summary → Type of Change → Changes
(from the actual commits only) → Commit map → Why → Related Issues → How to
Test → Checklist.

- **Title** must be a conventional commit (validated by CI):
  `feat(svelte): add demo section`
- **Labels:** type (`enhancement`, `bug`, `documentation`, `testing`,
  `performance`, `infra`) + size (`size/S` 1-3 commits, `size/M` 4-8,
  `size/L` 9+)
- **Checks:** `build`, `e2e`, and `messages` must all pass — never merge red;
  fix on the same branch and push.
- **Changesets:** add one whenever the package surface changes (`bunx
  changeset`) — releases are generated automatically from merged changesets
  (Version Packages PR → tag → categorized draft release).

## Development

```bash
bun install
bun test                      # unit tests (89, happy-dom)
bun run test:e2e              # browser tests (16, Playwright + Chromium)
bun run build                 # emit dist/ (modules, CDN global, declarations)
bun scripts/check-size.ts     # gzip size budgets per bundle
bun scripts/check-package.ts  # npm tarball contents audit
bun run lint && bun run format:check
```

CI runs all of the above (plus `publint` and `are-the-types-wrong` on the
packed tarball) on every PR.

## License

[MIT](LICENSE)
