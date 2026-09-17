import { useController, type FieldValues, type UseControllerProps } from 'react-hook-form';
import { useCallback, useEffect, useRef } from 'react';
import type { MrdTextFieldElement } from '../types';

export interface FormTextFieldProps<T extends FieldValues> extends UseControllerProps<T> {
  label: string;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
  autocomplete?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  /** Focus this field when the form is submitted with errors and this is the first invalid one. */
  focusOnError?: boolean;
}

/**
 * React Hook Form adapter for `<mrd-text-field>`.
 *
 * Three things this solves that a naive `<mrd-text-field {...register('x')} />`
 * does not:
 *
 * 1. **Custom events.** The component emits `mrdInput`, not a bubbling React
 *    `onChange`. React's synthetic event system never sees it, so we bind the
 *    listener imperatively and feed `field.onChange` ourselves.
 *
 * 2. **Property vs attribute.** `value` and `error` are properties on the custom
 *    element. Setting them as attributes stringifies (and `undefined` becomes
 *    the literal "undefined"), so we assign to the element instance.
 *
 * 3. **Error focus management.** RHF's `shouldFocusError` calls `.focus()` on a
 *    ref, but the real input lives inside a shadow root. We register the
 *    component's `setFocus()` method as the field ref instead, so submitting an
 *    invalid form still moves focus to the first problem — WCAG 3.3.1.
 */
export function FormTextField<T extends FieldValues>({
  name,
  control,
  rules,
  shouldUnregister,
  defaultValue,
  label,
  hint,
  placeholder,
  type = 'text',
  autocomplete,
  size = 'md',
  disabled = false,
  required = false,
  hideLabel = false,
  focusOnError = true,
}: FormTextFieldProps<T>) {
  const elementRef = useRef<MrdTextFieldElement | null>(null);

  const { field, fieldState } = useController<T>({
    name,
    control,
    rules,
    shouldUnregister,
    defaultValue,
  } as UseControllerProps<T>);

  /** Bridge the custom events into RHF. */
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const onInput = (event: Event) => {
      const detail = (event as CustomEvent<{ value: string }>).detail;
      field.onChange(detail.value);
    };
    const onBlur = () => field.onBlur();

    el.addEventListener('mrdInput', onInput);
    el.addEventListener('mrdBlur', onBlur);
    return () => {
      el.removeEventListener('mrdInput', onInput);
      el.removeEventListener('mrdBlur', onBlur);
    };
  }, [field]);

  /** Keep element properties in sync — attributes would stringify these. */
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    el.value = field.value ?? '';
    el.error = fieldState.error?.message;
  }, [field.value, fieldState.error?.message]);

  /**
   * Hand RHF something it can call `.focus()` on. `setFocus` is async on the
   * element, and RHF ignores the return value, which is fine.
   */
  const setRef = useCallback(
    (el: MrdTextFieldElement | null) => {
      elementRef.current = el;
      if (!focusOnError) return;
      field.ref(el ? ({ focus: () => void el.setFocus(), name } as unknown as HTMLElement) : null);
    },
    [field, name, focusOnError],
  );

  return (
    <mrd-text-field
      ref={setRef}
      label={label}
      hint={hint}
      placeholder={placeholder}
      type={type}
      size={size}
      name={name}
      autocomplete={autocomplete}
      disabled={disabled || undefined}
      required={required || undefined}
      hide-label={hideLabel || undefined}
    />
  );
}
