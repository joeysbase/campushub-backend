// Flat config for the backend (src/, shared/, scripts/). The client lints with oxlint.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'client/', 'node_modules/'] },
  tseslint.configs.recommended,
  {
    rules: {
      // CLAUDE.md: no `any`.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    // Process entry points and tooling may log progress.
    files: ['src/server.ts', 'src/config/**', 'src/scripts/**', 'scripts/**'],
    rules: { 'no-console': 'off' },
  },
);
