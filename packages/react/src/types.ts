import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react';

/**
 * Typed custom-element surface for React.
 *
 * Optional props are declared `?: T | undefined` rather than `?: T`. The repo
 * compiles with `exactOptionalPropertyTypes`, under which those two are not the
 * same thing: the first allows `hint={undefined}`, the second forbids it. Since
 * passing `undefined` is how a caller omits a conditional attribute, the second
 * would make every optional prop unusable from a variable.
 *
 * React 19 passes unknown props straight to the DOM as attributes, which is
 * what we want for Web Components. React 18 needs the JSX namespace widened,
 * which is what this file does. Once the repo is React 19 only, these
 * declarations can be generated from custom-elements.json instead.
 */
export interface MrdTextFieldElement extends HTMLElement {
  value: string;
  error?: string | undefined;
  label: string;
  setFocus(options?: FocusOptions): Promise<void> | undefined;
  selectText(): Promise<void>;
}

export interface MrdDialogElement extends HTMLElement {
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
}

type WebComponentProps<T> =
  (DetailedHTMLProps<HTMLAttributes<T>, T> & { ref?: Ref<T | null> }) | undefined;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mrd-button': WebComponentProps<HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | undefined;
        size?: 'sm' | 'md' | 'lg' | undefined;
        type?: 'button' | 'submit' | 'reset' | undefined;
        href?: string | undefined;
        disabled?: boolean | undefined;
        loading?: boolean | undefined;
        label?: string | undefined;
        'full-width'?: boolean | undefined;
      };
      'mrd-text-field': WebComponentProps<MrdTextFieldElement> & {
        label: string;
        name?: string | undefined;
        type?: string | undefined;
        hint?: string | undefined;
        placeholder?: string | undefined;
        size?: 'sm' | 'md' | 'lg' | undefined;
        disabled?: boolean | undefined;
        required?: boolean | undefined;
        autocomplete?: string | undefined;
        'hide-label'?: boolean | undefined;
      };
      'mrd-banner': WebComponentProps<HTMLElement> & {
        tone?: 'info' | 'success' | 'warning' | 'danger' | undefined;
        heading?: string | undefined;
        dismissible?: boolean | undefined;
        live?: boolean | undefined;
      };
      'mrd-dialog': WebComponentProps<MrdDialogElement> & {
        heading?: string | undefined;
        size?: 'sm' | 'md' | 'lg' | 'full' | undefined;
        persistent?: boolean | undefined;
        open?: boolean | undefined;
      };
    }
  }
}
