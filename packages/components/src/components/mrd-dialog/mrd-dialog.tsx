import type { EventEmitter } from '@stencil/core';
import { Component, Prop, State, Watch, Method, Event, Element, h, Host } from '@stencil/core';
import { getFocusableElements, FocusTrap } from '../../utils/focus';
import { lockScroll, unlockScroll } from '../../utils/scroll-lock';

/**
 * A modal dialog.
 *
 * Built on the native `<dialog>` element with `showModal()`, which buys the
 * top layer, the `::backdrop` pseudo-element, inertness of the page behind it
 * and Escape-to-close for free — all things hand-rolled modals get wrong.
 *
 * What the platform still does not give us, and this component adds:
 *   - focus moved to the right element on open (heading, not the close button,
 *     so a screen-reader user hears what the dialog is about first)
 *   - focus returned to the trigger on close, including when the trigger has
 *     since been removed from the DOM
 *   - a focus trap for browsers where `showModal` is unavailable or the dialog
 *     is rendered non-modally
 *   - scroll lock that does not shift layout
 *   - `aria-labelledby` wired to the heading without the consumer having to
 *     manage ids
 *
 * @slot - Dialog body.
 * @slot header - Replaces the default heading.
 * @slot footer - Action row. Put the primary action last in DOM order.
 * @part dialog - The native dialog element.
 * @part header - Header region.
 * @part body - Scrollable body region.
 * @part footer - Footer region.
 */
/**
 * Why a dialog closed. Consumers branch on this: dismissing with Escape is not
 * the same as confirming, and an autosave-on-close should not fire for either.
 */
export type DialogCloseReason = 'escape' | 'backdrop' | 'close-button' | 'programmatic';

@Component({
  tag: 'mrd-dialog',
  styleUrl: 'mrd-dialog.scss',
  shadow: true,
})
export class MrdDialog {
  @Element() host!: HTMLMrdDialogElement;

  private dialogEl?: HTMLDialogElement;
  private trap: FocusTrap | undefined;
  private previouslyFocused?: HTMLElement | null;
  private readonly headingId = `mrd-dialog-title-${Math.random().toString(36).slice(2, 9)}`;

  /** Whether the dialog is shown. Two-way via `mrdClose`. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Accessible title. Rendered as the heading unless the `header` slot is used. */
  @Prop() heading?: string;

  /** Visual width. */
  @Prop({ reflect: true }) size: 'sm' | 'md' | 'lg' | 'full' = 'md';

  /**
   * Prevent dismissal by Escape or backdrop click. Use only when losing the
   * dialog would lose the user's work — never merely to keep attention.
   */
  @Prop() persistent = false;

  /** Hide the close affordance. Requires `persistent` to be false somewhere else. */
  @Prop() hideCloseButton = false;

  /** Accessible name for the close control. */
  @Prop() closeLabel = 'Close dialog';

  /**
   * CSS selector, resolved inside the dialog, for the element to focus on open.
   * Defaults to the heading, which is what you almost always want.
   */
  @Prop() initialFocus?: string;

  @State() private hasFooter = false;

  /** Fired before opening. Cancelable. */
  @Event({ eventName: 'mrdOpen', cancelable: true }) mrdOpen!: EventEmitter<void>;

  /** Fired after closing, with the reason. */
  @Event({ eventName: 'mrdClose' }) mrdClose!: EventEmitter<{ reason: DialogCloseReason }>;

  componentWillLoad() {
    this.hasFooter = Boolean(this.host.querySelector('[slot="footer"]'));
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleEscapeKey, true);
    this.trap?.deactivate();
    unlockScroll();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    isOpen ? this.activate() : this.deactivate('programmatic');
  }

  /** Open the dialog. Resolves once focus has moved. */
  @Method()
  async show(): Promise<void> {
    if (this.open) return;
    if (this.mrdOpen.emit().defaultPrevented) return;
    this.open = true;
  }

  /** Close the dialog. */
  @Method()
  async hide(): Promise<void> {
    if (!this.open) return;
    this.open = false;
  }

  private activate() {
    // Remember the trigger so focus can be returned precisely.
    this.previouslyFocused = (document.activeElement as HTMLElement) ?? null;

    const dialog = this.dialogEl;
    if (!dialog) return;

    if (typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal();
    } else {
      // No top layer available. The dialog still opens; it just does not make
      // the rest of the document inert.
      dialog.setAttribute('open', '');
    }

    /*
     * The trap runs even when `showModal()` succeeded, which looks redundant and
     * is not.
     *
     * A modal dialog in the top layer contains Tab to its own subtree. Our
     * content does not live there: the `<dialog>` is inside this component's
     * shadow root and renders `<slot>`s, so everything the consumer passed is a
     * DOM child of the *host*, not of the dialog. Chromium's containment follows
     * the DOM tree, so Tab walks straight past the footer buttons and out to
     * `<body>` — verified in the e2e suite, which is the only place it shows up.
     *
     * The trap is cheap (one capturing keydown listener) and, since it consults
     * the flattened tree, it covers both cases with one path.
     */
    this.trap = new FocusTrap(dialog, this.host);
    this.trap.activate();
    document.addEventListener('keydown', this.handleEscapeKey, true);

    lockScroll();
    requestAnimationFrame(() => this.moveInitialFocus(dialog));
  }

  private moveInitialFocus(dialog: HTMLDialogElement) {
    const target = this.initialFocus
      ? dialog.querySelector<HTMLElement>(this.initialFocus)
      : (dialog.querySelector<HTMLElement>('[data-dialog-heading]') ??
        getFocusableElements(dialog)[0]);
    target?.focus();
  }

  private deactivate(reason: DialogCloseReason) {
    document.removeEventListener('keydown', this.handleEscapeKey, true);
    this.trap?.deactivate();
    this.trap = undefined;
    unlockScroll();

    if (this.dialogEl?.open) this.dialogEl.close();

    // If the trigger has gone (a row deleted by the dialog, say), fall back to
    // body so focus never lands nowhere.
    const target = this.previouslyFocused;
    if (target && target.isConnected) target.focus();
    else document.body.focus?.();

    this.mrdClose.emit({ reason });
  }

  /** Native `cancel` fires for Escape; we intercept it to honour `persistent`. */
  private handleCancel = (event: Event) => {
    event.preventDefault();
    this.dismissByEscape();
  };

  /**
   * Escape, for the cases the platform does not cover.
   *
   * The native `cancel` event only fires for a dialog in the top layer. On the
   * fallback path — no `showModal`, `open` set by hand — nothing fires it, so
   * without this listener Escape silently does nothing on exactly the browsers
   * least able to cope with a modal they cannot dismiss.
   *
   * Both routes converge on `dismissByEscape`, which is idempotent, so the
   * modal case closing twice is harmless.
   */
  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (!this.open) return;
    this.dismissByEscape();
  };

  private dismissByEscape() {
    if (this.persistent || !this.open) return;
    this.open = false;
    this.deactivate('escape');
  }

  /**
   * A click on `<dialog>` itself is a backdrop click — the panel inside stops
   * propagation of its own clicks by being a separate element.
   */
  private handleDialogClick = (event: MouseEvent) => {
    if (this.persistent) return;
    if (event.target === this.dialogEl) {
      this.open = false;
      this.deactivate('backdrop');
    }
  };

  private handleCloseClick = () => {
    this.open = false;
    this.deactivate('close-button');
  };

  render() {
    return (
      <Host>
        <dialog
          part="dialog"
          class="dialog"
          ref={el => (this.dialogEl = el as HTMLDialogElement)}
          aria-labelledby={this.heading ? this.headingId : undefined}
          onCancel={this.handleCancel}
          onClick={this.handleDialogClick}
        >
          <div class="panel">
            <header part="header" class="header">
              <slot name="header">
                {this.heading && (
                  <h2 id={this.headingId} class="heading" data-dialog-heading tabindex="-1">
                    {this.heading}
                  </h2>
                )}
              </slot>
              {!this.hideCloseButton && (
                <button
                  type="button"
                  class="close"
                  aria-label={this.closeLabel}
                  onClick={this.handleCloseClick}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              )}
            </header>

            <div part="body" class="body">
              <slot />
            </div>

            {this.hasFooter && (
              <footer part="footer" class="footer">
                <slot name="footer" />
              </footer>
            )}
          </div>
        </dialog>
      </Host>
    );
  }
}
