import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', '.husky/**', '_site/**', 'playground/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
