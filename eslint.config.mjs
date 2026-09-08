import next from 'eslint-config-next'

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'design/**',
      // Agent worktrees are full copies of the repo living inside it.
      '.claude/**',
      'next-env.d.ts',
    ],
  },
  ...next,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]

export default config
