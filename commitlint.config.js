/**
 * Commit message rules — enforced by the commit-msg hook locally and by the
 * CI `messages` job for every PR (title via semantic-pull-request, commits
 * via commitlint --from origin/main).
 *
 * Conventions live in CONTRIBUTING.md and .agents/skills/ferry-commit.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  // Auto-generated merge commits are not authored messages.
  ignores: [(commit) => commit.startsWith('Merge pull request')],
  rules: {
    // Repo scopes: keep them aligned with the areas we touch. Warn (1) so new
    // areas are not blocked — the ferry-commit skill documents the list.
    'scope-enum': [
      1,
      'always',
      [
        'core',
        'clipboard',
        'react',
        'vue',
        'svelte',
        'playground',
        'release',
        'ci',
        'deps',
        'tests',
        'size',
        'agents',
      ],
    ],
    // Encourage issue references without blocking chores like version bumps.
    'references-empty': [1, 'never'],
    // Explicit copies of the conventional defaults we care about most.
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'subject-full-stop': [2, 'never'],
  },
};
