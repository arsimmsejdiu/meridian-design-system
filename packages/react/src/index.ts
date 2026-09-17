/**
 * `@meridian/react` — React Hook Form adapters and hooks for Meridian.
 *
 * Note what this module does NOT do: it does not import `@meridian/components`
 * for its side effect. Defining the custom elements is a side effect, and this
 * package declares `"sideEffects": false` so that an application importing only
 * `useTheme` does not pull in the component runtime. A bundler is entitled to
 * drop a side-effect-only import from a package marked side-effect free — so
 * putting one here would mean the elements are registered in development and
 * silently missing from the production build.
 *
 * Applications register the elements themselves, once, at their entry point:
 *
 * ```ts
 * import '@meridian/tokens/css';
 * import '@meridian/components';
 * ```
 *
 * See docs/adr/0005-react-hook-form-adapters-over-raw-bindings.md.
 */

export { MeridianForm } from './form/MeridianForm.js';
export type { MeridianFormProps } from './form/MeridianForm.js';

export { FormTextField } from './form/FormTextField.js';
export type { FormTextFieldProps } from './form/FormTextField.js';

export { useTheme } from './hooks/useTheme.js';
export type { Theme, ResolvedTheme } from './hooks/useTheme.js';

export type { MrdTextFieldElement, MrdDialogElement } from './types.js';
