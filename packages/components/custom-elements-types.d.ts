/**
 * Type entry for the `dist-custom-elements` build.
 *
 * Stencil splits this output in two: the runtime (`defineCustomElement*`) goes
 * to `dist/components/`, while the component interfaces and the
 * `MrdXCustomEvent` types go to `dist/types/components.d.ts`. The generated
 * Angular and React bindings import from the first path and expect both. This
 * barrel joins them, and the `exports` map points `./components` here.
 *
 * Named `custom-elements-types.d.ts` rather than `custom-elements.d.ts` for a
 * reason worth keeping: the `docs-json` output target writes `custom-elements.json`
 * *and* a sibling `custom-elements.d.ts` describing it, which silently replaces
 * any file of that name on every build. The failure is invisible — the file is
 * still there, it just contains something else — and the resulting error points
 * at the Angular package, three steps away from the cause.
 */
export * from './dist/components/index';
export * from './dist/types/components';
