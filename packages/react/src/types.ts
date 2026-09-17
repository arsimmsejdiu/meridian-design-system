import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react';

/**
 * Typed custom-element surface for React.
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
  setFocus(options?: FocusOptions): Promise<void>;
  selectText(): Promise<void>;
}

export interface MrdDialogElement extends HTMLElement {
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
}

type WebComponentProps<T> = DetailedHTMLProps<HTMLAttributes<T>, T> & { ref?: Ref<T | null> };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mrd-button': WebComponentProps<HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
        size?: 'sm' | 'md' | 'lg';
        type?: 'button' | 'submit' | 'reset';
        href?: string;
        disabled?: boolean;
        loading?: boolean;
        label?: string;
        'full-width'?: boolean;
      };
      'mrd-text-field': WebComponentProps<MrdTextFieldElement> & {
        label: string;
        name?: string;
        type?: string;
        hint?: string;
        placeholder?: string;
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        required?: boolean;
        autocomplete?: string;
        'hide-label'?: boolean;
      };
      'mrd-banner': WebComponentProps<HTMLElement> & {
        tone?: 'info' | 'success' | 'warning' | 'danger';
        heading?: string;
        dismissible?: boolean;
        live?: boolean;
      };
      'mrd-dialog': WebComponentProps<MrdDialogElement> & {
        heading?: string;
        size?: 'sm' | 'md' | 'lg' | 'full';
        persistent?: boolean;
        open?: boolean;
      };
    }
  }
}
