import { Component, Prop, h, Host, Element, Event, EventEmitter, Method } from '@stencil/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A button, or a link that looks like one.
 *
 * Two decisions worth knowing about:
 *
 * 1. `shadow: true`. Styles cannot leak in or out, which is what makes the
 *    component safe to drop into an estate with several competing stylesheets.
 *    The cost is that consumers style it through `::part` and custom properties
 *    only — deliberate, see docs/adr/0003-shadow-dom-and-the-styling-contract.md.
 *
 * 2. When `href` is set we render an `<a>`, not a `<button>` with a click
 *    handler. Screen readers announce the two differently, middle-click and
 *    "open in new tab" only work on a real anchor, and a disabled link is
 *    removed from the tab order rather than faked with `pointer-events: none`.
 *
 * @slot - The button label. Text, or text with icons.
 * @slot start - Leading icon. Decorative; always hidden from assistive tech.
 * @slot end - Trailing icon. Decorative.
 * @part base - The rendered button or anchor element.
 * @part label - The label wrapper.
 * @part spinner - The loading indicator.
 */
@Component({
  tag: 'mrd-button',
  styleUrl: 'mrd-button.scss',
  shadow: true,
})
export class MrdButton {
  @Element() host!: HTMLMrdButtonElement;

  /** Visual weight. Use exactly one `primary` per view. */
  @Prop({ reflect: true }) variant: ButtonVariant = 'primary';

  /** Control height. `sm` still meets the 44px pointer target via a pseudo-element. */
  @Prop({ reflect: true }) size: ButtonSize = 'md';

  /** Native button behaviour. Ignored when `href` is set. */
  @Prop() type: ButtonType = 'button';

  /** Render an anchor instead of a button. */
  @Prop() href?: string;

  /** Anchor target. Adds `rel="noreferrer noopener"` automatically for `_blank`. */
  @Prop() target?: '_blank' | '_self' | '_parent' | '_top';

  /** Disable interaction. Prefer `loading` for in-flight actions. */
  @Prop({ reflect: true }) disabled = false;

  /**
   * In-flight state. Keeps the button focusable and announces progress via
   * `aria-busy`, rather than disabling it — a disabled control loses focus,
   * which strands a keyboard user mid-flow.
   */
  @Prop({ reflect: true }) loading = false;

  /** Announced while `loading` is true. */
  @Prop() loadingLabel = 'Loading';

  /** Stretch to the width of the container. */
  @Prop({ reflect: true }) fullWidth = false;

  /**
   * Accessible name, when the visible label is not enough — icon-only buttons,
   * or "Edit" repeated down a table where each needs a distinct name.
   */
  @Prop() label?: string;

  /** Fired on activation. Not fired while `disabled` or `loading`. */
  @Event({ eventName: 'mrdClick' }) mrdClick!: EventEmitter<{ originalEvent: MouseEvent }>;

  /** Move focus to the control. */
  @Method()
  async setFocus(options?: FocusOptions): Promise<void> {
    this.host.shadowRoot?.querySelector<HTMLElement>('[part="base"]')?.focus(options);
  }

  private handleClick = (event: MouseEvent) => {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.mrdClick.emit({ originalEvent: event });

    // A shadow-DOM button does not participate in the light-DOM form by itself.
    if (this.type === 'submit' && !this.href) this.submitAssociatedForm();
  };

  /**
   * Submit the closest light-DOM form. `requestSubmit` rather than `submit`, so
   * native validation and the submit event still run.
   */
  private submitAssociatedForm() {
    const form = this.host.closest('form');
    if (!form) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.submit();
  }

  render() {
    const isLink = Boolean(this.href) && !this.disabled;
    const Tag = isLink ? 'a' : 'button';
    const rel = this.target === '_blank' ? 'noreferrer noopener' : undefined;

    return (
      <Host>
        <Tag
          part="base"
          class="button"
          // A disabled anchor is not a thing; we render a button instead and
          // mark it disabled natively, keeping it out of the tab order.
          {...(isLink
            ? { href: this.href, target: this.target, rel }
            : { type: this.type, disabled: this.disabled || undefined })}
          aria-label={this.label}
          aria-busy={this.loading ? 'true' : undefined}
          aria-disabled={this.disabled && isLink ? 'true' : undefined}
          onClick={this.handleClick}
        >
          {this.loading && (
            <span part="spinner" class="spinner" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
                <circle cx="8" cy="8" r="6.5" fill="none" stroke-width="2.5" />
              </svg>
            </span>
          )}
          <span class="slot slot--start" aria-hidden="true">
            <slot name="start" />
          </span>
          <span part="label" class="label">
            <slot />
          </span>
          <span class="slot slot--end" aria-hidden="true">
            <slot name="end" />
          </span>
          {/* Politely announced once, not on every render. */}
          {this.loading && (
            <span class="visually-hidden" role="status">
              {this.loadingLabel}
            </span>
          )}
        </Tag>
      </Host>
    );
  }
}
