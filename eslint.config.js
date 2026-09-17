import js from '@eslint/js';
import ts from 'typescript-eslint';

/**
 * Flat config. The rules that matter here are the ones that catch
 * accessibility and API mistakes, not stylistic ones — Prettier owns style.
 */
export default ts.config(
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Public API shape is versioned; an implicit any in it is a future break.
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.spec.tsx', '**/*.test.tsx', '**/*.e2e.ts', '**/*.stories.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/loader/**',
      '**/www/**',
      '**/storybook-static/**',
      '**/generated/**',
    ],
  },
);
