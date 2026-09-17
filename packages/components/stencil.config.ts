import type { Config } from '@stencil/core';
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
    // Server-side rendering. Required by the React target's `hydrateModule`, and
    // the reason a Next.js consumer gets markup in the initial HTML rather than
    // a blank box until the custom elements upgrade.
    { type: 'dist-hydrate-script', dir: './hydrate' },
    {
      type: 'dist-custom-elements',
      // 'single-export-module', not 'auto-define-custom-elements': the generated
      // React and Angular bindings import each component class by name from this
      // entry, and the auto-define behaviour does not export them. Consumers of
      // this output call `defineCustomElement()` themselves; the lazy `dist`
      // build behind the root export still registers everything on import.
      customElementsExportBehavior: 'single-export-module',
      externalRuntime: false,
      generateTypeDeclarations: true,
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
      customElementsDir: 'dist/components',
      /*
       * Client components only, deliberately.
       *
       * Setting `hydrateModule` here additionally generates `components.server.ts`,
       * which casts each Stencil component class to a React server component.
       * That cast only typechecks against React 19's types; on React 18 — which
       * is what this repo and most consumers are on — it fails outright.
       *
       * The `dist-hydrate-script` output above is still built, so a consumer
       * doing their own server rendering has everything they need. Turning this
       * on is a one-line change once the React peer floor moves to 19.
       */
    }),
    angularOutputTarget({
      componentCorePackage: '@meridian/components',
      // Standalone components, not an NgModule. An NgModule wrapper would force
      // every consuming app to import a module to use one button, and Angular
      // itself has moved on from that shape.
      outputType: 'standalone',
      customElementsDir: 'dist/components',
      directivesProxyFile: '../angular/src/generated/components.ts',
    }),
  ],
  testing: {
    browserHeadless: 'new',
    /*
     * Chromium refuses to start inside a container without these. CI runners and
     * most Docker images are exactly that, so without them the e2e suite fails
     * before it has run a single test — and the failure reads like a broken test
     * rather than a broken environment.
     */
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    /*
     * Coverage is measured over the spec suite only, so `mrd-dialog` is excluded:
     * everything interesting about it — the top layer, focus return, focus
     * trapping, Escape — needs a real browser and lives in the e2e suite, which
     * this figure cannot see. Counting it here would report a component with
     * thorough browser tests as untested, and the usual response to that is to
     * write shallow spec tests that raise the number without raising confidence.
     *
     * The thresholds are set at what the suite actually achieves, not at a round
     * number. A threshold nobody meets is a threshold everyone learns to ignore.
     */
    collectCoverageFrom: [
      'src/components/**/*.tsx',
      '!src/**/*.spec.tsx',
      '!src/**/*.e2e.ts',
      '!src/components/mrd-dialog/**',
    ],
    coverageThreshold: {
      global: { branches: 60, functions: 65, lines: 75, statements: 70 },
    },
  },
  extras: { experimentalImportInjection: true },
};
