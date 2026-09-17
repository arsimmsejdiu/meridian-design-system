import type { EventEmitter } from '@stencil/core';
import { Component, Prop, State, Event, Method, Element, h, Host, Watch } from '@stencil/core';

export type TextFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';

/**
 * A labelled text input.
 *
 * The interesting part of a text field is not the input, it is the wiring:
 *
 *   - the label is a real `<label for>`, so clicking it focuses the field and
 *     the accessible name is computed by the platform rather than guessed
 *   - hint and error text are joined into `aria-describedby` in a stable order,
 *     so a screen reader reads "Email. Edit text. We'll only use this for
 *     receipts. Enter a valid email address."
 *   - `aria-invalid` is set from the error, not from a separate flag that can
 *     drift out of sync with it
 *   - the error is announced through a live region, so a user who has already
 *     moved on hears it without having to go back
 *   - `formAssociated` makes the component submit with a native form, which a
 *     shadow-DOM input otherwise silently fails to do
 *
 * @part label - The label element.
 * @part input - The native input.
 * @part hint - Hint text.
 * @part error - Error text.
 */
@Component({
  tag: 'mrd-text-field',
  styleUrl: 'mrd-text-field.scss',
  shadow: true,
  formAssociated: true,
})
export class MrdTextField {
  @Element() host!: HTMLMrdTextFieldElement;

  private inputEl?: HTMLInputElement;
  private internals?: ElementInternals;
  private readonly uid = Math.random().toString(36).slice(2, 9);

  /** Visible label. Required — a placeholder is not a label. */
  @Prop() label!: string;

  /** Field name for form submission. */
  @Prop() name?: string;

  /** Input type. `number` still reports as text to AT for better announcement. */
  @Prop() type: TextFieldType = 'text';

  /** Current value. */
  @Prop({ mutable: true }) value = '';

  /** Supporting text shown under the field, announced before any error. */
  @Prop() hint?: string;

  /**
   * Error message. Setting this marks the field invalid and announces it.
   * Empty string or undefined means valid.
   */
  @Prop() error?: string;

  /** Short example of the expected format. Never a substitute for `label`. */
  @Prop() placeholder?: string;

  @Prop({ reflect: true }) disabled = false;
  @Prop({ reflect: true }) readonly = false;
  @Prop({ reflect: true }) required = false;

  /** Visually hide the label but keep it for assistive technology. */
  @Prop() hideLabel = false;

  /** Control height. */
  @Prop({ reflect: true }) size: 'sm' | 'md' | 'lg' = 'md';

  @Prop() autocomplete?: string;
  @Prop() maxlength?: number;
  @Prop() inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'url' | 'search';

  @State() private hasFocus = false;

  /** Fired on each keystroke. */
  @Event({ eventName: 'mrdInput' }) mrdInput!: EventEmitter<{ value: string }>;

  /** Fired when the value is committed (blur or Enter). */
  @Event({ eventName: 'mrdChange' }) mrdChange!: EventEmitter<{ value: string }>;

  @Event({ eventName: 'mrdFocus' }) mrdFocus!: EventEmitter<void>;
  @Event({ eventName: 'mrdBlur' }) mrdBlur!: EventEmitter<void>;

  connectedCallback() {
    /*
     * Form association is progressive enhancement, and the feature detection has
     * to be done on the *methods*, not on `attachInternals` itself. Safari 16.4
     * ships `attachInternals()` but returns an object without `setFormValue`,
     * and so does Stencil's test environment — calling it blind throws during
     * connect and takes the whole component down, on the browser least likely
     * to be in anyone's test matrix.
     *
     * Without it the field still renders, validates and announces correctly; it
     * just does not submit with a native `<form>`.
     */
    const internals = this.host.attachInternals?.();
    this.internals = typeof internals?.setFormValue === 'function' ? internals : undefined;

    this.syncFormValue();
  }

  @Watch('value')
  syncFormValue() {
    this.internals?.setFormValue(this.value ?? '');
  }

  @Watch('error')
  syncValidity() {
    if (typeof this.internals?.setValidity !== 'function') return;
    if (this.error) this.internals.setValidity({ customError: true }, this.error, this.inputEl);
    else this.internals.setValidity({});
  }

  /** Focus the input. */
  @Method()
  async setFocus(options?: FocusOptions): Promise<void> {
    this.inputEl?.focus(options);
  }

  /** Select the current value. */
  @Method()
  async selectText(): Promise<void> {
    this.inputEl?.select();
  }

  private handleInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
    this.mrdInput.emit({ value: this.value });
  };

  private handleChange = () => this.mrdChange.emit({ value: this.value });

  private handleFocus = () => {
    this.hasFocus = true;
    this.mrdFocus.emit();
  };

  private handleBlur = () => {
    this.hasFocus = false;
    this.mrdBlur.emit();
  };

  /**
   * Order matters: hint first, then error. A screen reader reads describedby
   * in the order given, and the hint is context for the error.
   */
  private describedBy(): string | undefined {
    const ids = [
      this.hint ? `hint-${this.uid}` : null,
      this.error ? `error-${this.uid}` : null,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : undefined;
  }

  render() {
    const inputId = `input-${this.uid}`;
    const invalid = Boolean(this.error);

    return (
      <Host>
        <div class={{ field: true, 'field--invalid': invalid, 'field--focused': this.hasFocus }}>
          <label
            part="label"
            class={{ label: true, 'visually-hidden': this.hideLabel }}
            htmlFor={inputId}
          >
            {this.label}
            {this.required && (
              <span class="required" aria-hidden="true">
                *
              </span>
            )}
            {/* The asterisk is decorative; `required` on the input is the real signal. */}
          </label>

          <div class="control">
            <span class="affix affix--start">
              <slot name="start" />
            </span>

            <input
              part="input"
              class="input"
              id={inputId}
              ref={el => (this.inputEl = el as HTMLInputElement)}
              type={this.type}
              name={this.name}
              value={this.value}
              placeholder={this.placeholder}
              disabled={this.disabled}
              readOnly={this.readonly}
              required={this.required}
              autocomplete={this.autocomplete}
              maxlength={this.maxlength}
              inputmode={this.inputmode}
              aria-invalid={invalid ? 'true' : undefined}
              aria-describedby={this.describedBy()}
              onInput={this.handleInput}
              onChange={this.handleChange}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
            />

            <span class="affix affix--end">
              <slot name="end" />
            </span>
          </div>

          {this.hint && (
            <p part="hint" class="hint" id={`hint-${this.uid}`}>
              {this.hint}
            </p>
          )}

          {/*
            role="alert" rather than aria-live="polite": a validation error is
            the one message worth interrupting for, and it only appears after a
            user action, so it is not a surprise.
          */}
          {this.error && (
            <p part="error" class="error" id={`error-${this.uid}`} role="alert">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path
                  d="M8 1.5 15 14H1L8 1.5zM8 6v4M8 11.5v1"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
              </svg>
              {this.error}
            </p>
          )}
        </div>
      </Host>
    );
  }
}
