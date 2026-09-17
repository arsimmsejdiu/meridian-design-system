import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { reactOutputTarget } from '@stencil/react-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';

/**
 * Web Components are the distribution format on purpose.
 *
 * Swiss Post-style estates run several frameworks at once and outlive any one of
 * them. Authoring in Stencil means the component contract is the DOM — custom
 * element, attributes, slots, events — and the framework wrappers below are
 * generated, not hand-maintained. See docs/adr/0001-web-components-as-the-distribution-format.md.
 */
export const config: Config = {
  namespace: 'meridian',
  globalStyle: 'src/global/global.scss',
  sourceMap: true,
  plugins: [
    sass({
      // Sass module resolution only. No `injectGlobalPaths`: injecting a global
      // partial prepends an `@import` above each file's own `@use` rules, which
      // Sass rejects outright — and a stylesheet whose dependencies are implicit
      // cannot be compiled or reasoned about on its own. Each component writes
      // `@use '../../styles/mixins' as *;` and says what it depends on.
      includePaths: ['src/styles'],
    }),
  ],
  outputTargets: [
    { type: 'dist', esmLoaderPath: '../loader' },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    { type: 'docs-readme', footer: '' },
    { type: 'docs-json', file: './custom-elements.json' },
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: '../../tokens/dist/tokens.css', dest: 'build/tokens.css' }],
    },
    reactOutputTarget({
      outDir: '../react/src/generated',
      hydrateModule: '@meridian/components/hydrate',
    }),
    angularOutputTarget({
      componentCorePackage: '@meridian/components',
      outputType: 'component',
      directivesProxyFile: '../angular/src/generated/components.ts',
      directivesArrayFile: '../angular/src/generated/index.ts',
    }),
  ],
  testing: {
    browserHeadless: 'new',
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    collectCoverageFrom: ['src/components/**/*.tsx', '!src/**/*.spec.tsx', '!src/**/*.e2e.ts'],
    coverageThreshold: {
      global: { branches: 80, functions: 85, lines: 85, statements: 85 },
    },
  },
  extras: { experimentalImportInjection: true },
};
