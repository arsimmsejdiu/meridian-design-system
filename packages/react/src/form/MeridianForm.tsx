import {
  FormProvider,
  useForm,
  type UseFormProps,
  type FieldValues,
  type SubmitHandler,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { ZodType } from 'zod';

export interface MeridianFormProps<T extends FieldValues> extends Omit<
  UseFormProps<T>,
  'resolver'
> {
  schema: ZodType<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
  /** Heading of the error summary. Should describe the problem, not the form. */
  errorSummaryHeading?: string;
  /** Set false to render inline errors only — rarely the right call. */
  errorSummary?: boolean;
  className?: string;
}

/** Flatten nested `errors` into `[path, message]`, in field order. */
function flattenErrors<T extends FieldValues>(
  errors: FieldErrors<T>,
  prefix = '',
): Array<[string, string]> {
  const out: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof (value as { message?: unknown }).message === 'string') {
      out.push([path, (value as { message: string }).message]);
    } else if (typeof value === 'object') {
      // Nested object or field array — recurse rather than reporting "invalid".
      out.push(...flattenErrors(value as FieldErrors<T>, path));
    }
  }

  return out;
}

/**
 * A form wrapper: Zod schema in, validated values out.
 *
 * Beyond wiring the resolver, it renders an **error summary** — the pattern
 * GOV.UK popularised and most design systems skip. On a failed submit the user
 * gets a single focusable region listing every problem, each entry linking to
 * its field. That is what makes a long form usable with a screen reader:
 * without it, the user has to walk the whole form again to find what went wrong.
 *
 * Covers WCAG 3.3.1 (error identification) and 3.3.3 (error suggestion).
 *
 * Note on focus: the summary is focused once per *failed submit*, keyed on
 * `submitCount`, not on every render while it is visible. Focusing in a render
 * callback looks equivalent and is not — it drags focus back to the summary on
 * every keystroke while the user is trying to fix the first field.
 */
export function MeridianForm<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  errorSummaryHeading = 'There is a problem',
  errorSummary = true,
  className,
  ...formOptions
}: MeridianFormProps<T>) {
  const methods = useForm<T>({
    ...formOptions,
    resolver: zodResolver(schema),
    // onTouched, not onChange: validating while someone is still typing their
    // email tells them it's wrong before they have finished writing it.
    mode: formOptions.mode ?? 'onTouched',
    /**
     * Two things cannot both have focus. React Hook Form's `shouldFocusError`
     * sends focus to the first invalid field; the summary wants it too, and
     * because RHF focuses after our effect, the field wins silently — you get
     * a summary the user is never told about.
     *
     * When the summary is rendered it takes focus and RHF's is turned off: the
     * summary states how many problems there are and lets the user choose one,
     * which is more use than being dropped into the first of seven. Without a
     * summary, RHF's behaviour is the right one and is left alone.
     */
    shouldFocusError: errorSummary ? false : (formOptions.shouldFocusError ?? true),
  });

  const summaryId = useId();
  const summaryRef = useRef<HTMLElement | null>(null);
  const focusedForSubmit = useRef(0);

  const { errors, submitCount, isSubmitting } = methods.formState;
  const entries = flattenErrors(errors);
  const showSummary = errorSummary && submitCount > 0 && entries.length > 0;

  useEffect(() => {
    if (!showSummary) return;
    if (focusedForSubmit.current === submitCount) return;
    focusedForSubmit.current = submitCount;

    /*
     * Focus after a frame, not in the effect body.
     *
     * The summary is a custom element. React has created it and set its
     * attributes by the time this effect runs, but the element has not
     * necessarily finished its own first render — and `focus()` on an element
     * the browser does not yet consider focusable is silently dropped. Nothing
     * throws; the summary simply appears and announces nothing, which is the
     * exact failure the summary exists to prevent.
     *
     * One frame is enough in practice, and the second attempt covers a slow
     * upgrade without looping.
     */
    let secondAttempt = 0;
    const first = requestAnimationFrame(() => {
      const el = summaryRef.current;
      el?.focus();

      if (el && document.activeElement !== el) {
        secondAttempt = requestAnimationFrame(() => {
          el.focus();
        });
      }
    });

    return () => {
      cancelAnimationFrame(first);
      if (secondAttempt) cancelAnimationFrame(secondAttempt);
    };
  }, [showSummary, submitCount]);

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        className={className}
        aria-busy={isSubmitting || undefined}
        onSubmit={event => {
          // handleSubmit returns a promise; React's onSubmit expects void.
          void methods.handleSubmit(onSubmit)(event);
        }}
      >
        {showSummary && (
          <mrd-banner
            id={summaryId}
            tone="danger"
            heading={errorSummaryHeading}
            live
            // Focusable as a target, but not in the tab order — a user who has
            // already moved past it should not have to pass through it again.
            tabIndex={-1}
            ref={summaryRef}
          >
            <ul style={{ margin: 0, paddingInlineStart: 'var(--mrd-space-200, 1rem)' }}>
              {entries.map(([name, message]) => (
                <li key={name}>
                  <a
                    href={`#${name}`}
                    /*
                     * A block with vertical padding, so the whole row is the
                     * target. axe flags these links under WCAG 2.2 SC 2.5.8
                     * otherwise: links in running prose are exempt from the
                     * 24x24 minimum, but these are the primary controls of the
                     * summary, not prose.
                     *
                     * Inline because this package ships no stylesheet, and a
                     * design system that requires a second import to be
                     * accessible will be used without it.
                     */
                    style={{
                      display: 'inline-block',
                      padding: 'var(--mrd-space-50, 0.25rem) 0',
                    }}
                    onClick={event => {
                      event.preventDefault();
                      // setFocus goes through our field ref, which calls the
                      // element's setFocus() method — the real input is inside
                      // a shadow root and cannot be reached with a DOM query.
                      methods.setFocus(name as never);
                    }}
                  >
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          </mrd-banner>
        )}
        {children}
      </form>
    </FormProvider>
  );
}
