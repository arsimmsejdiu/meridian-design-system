import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';

/**
 * Flat config. The rules that matter here are the ones that catch
 * accessibility and API mistakes, not stylistic ones — Prettier owns style.
 */
export default ts.config(
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  {
    /*
     * Build scripts and config files are plain ESM outside any tsconfig project,
     * so the type-aware rules have no program to consult and error out rather
     * than skipping. Lint them, but without type information.
     */
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    ...ts.configs.disableTypeChecked,
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: false, project: false },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
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
  {
    /*
     * Stencil's component idioms, which the strict type-checked preset reads as
     * mistakes:
     *
     *  - `@Method()` members must be async whether or not they await anything —
     *    that is the contract for calling a method across the lazy-loading
     *    boundary, so `require-await` is wrong here by construction.
     *  - `h()` JSX is typed loosely by the compiler, so a `render()` return is
     *    `any` as far as the linter can tell.
     *  - decorated class members are assigned by the compiler, not by us.
     */
    files: ['packages/components/**/*.ts', 'packages/components/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./packages/components/tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['packages/react/**/*.ts', 'packages/react/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./packages/react/tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `declare global { namespace JSX }` is the only way to widen React 18's
      // intrinsic elements for custom elements. There is no module syntax for it.
      '@typescript-eslint/no-namespace': 'off',
      // Element method signatures mirror the Stencil `@Method()` contract, which
      // is async by definition even where the body has nothing to await.
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Test doubles pass one-line arrows to APIs typed as returning void, and
      // deliberately exercise deprecated paths (Safari's MediaQueryList
      // addListener) that the code under test still has to support.
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    /*
     * Stories are documentation that happens to compile. They reach into shadow
     * roots to assert behaviour, call component methods the DOM types do not
     * know about, and take `args` that Storybook types as `any` by design.
     * Enforcing the strict type-aware preset here produces noise, not safety —
     * the components themselves are covered by the block above.
     */
    files: ['apps/docs/**/*.ts', 'apps/docs/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./apps/docs/tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
);
