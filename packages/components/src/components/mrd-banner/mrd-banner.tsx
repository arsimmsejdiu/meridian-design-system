import type { EventEmitter } from '@stencil/core';
import { Component, Prop, Event, h, Host, State } from '@stencil/core';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

/**
 * An inline status message.
 *
 * The one decision that matters here is the ARIA role, and it depends on
 * urgency rather than on tone:
 *
 *   - `danger`  → role="alert"   (assertive; interrupts, for errors the user must act on)
 *   - anything else → role="status" (polite; waits for a pause)
 *
 * Getting this wrong is the commonest accessibility bug in a design system:
 * a success toast with role="alert" cuts off whatever the user was listening to.
 *
 * @slot - Message body.
 * @slot actions - Optional action row.
 * @part base - The banner container.
 */
@Component({ tag: 'mrd-banner', styleUrl: 'mrd-banner.scss', shadow: true })
export class MrdBanner {
  /** Visual and semantic tone. */
  @Prop({ reflect: true }) tone: BannerTone = 'info';

  /** Optional bold heading above the message. */
  @Prop() heading?: string;

  /** Show a dismiss control. */
  @Prop() dismissible = false;

  /** Accessible name for the dismiss control. */
  @Prop() dismissLabel = 'Dismiss message';

  /**
   * Announce on mount. Off by default: a banner rendered with the page is part
   * of the page, and announcing it again is noise. Turn on when the banner
   * appears in response to something the user did.
   */
  @Prop() live = false;

  @State() private dismissed = false;

  /** Fired when dismissed. */
  @Event({ eventName: 'mrdDismiss' }) mrdDismiss!: EventEmitter<void>;

  private handleDismiss = () => {
    this.dismissed = true;
    this.mrdDismiss.emit();
  };

  render() {
    if (this.dismissed) return null;

    const assertive = this.tone === 'danger';
    const role = this.live || assertive ? (assertive ? 'alert' : 'status') : undefined;

    return (
      <Host>
        <div part="base" class="banner" role={role}>
          <span class="icon" aria-hidden="true">
            {this.icon()}
          </span>

          <div class="content">
            {this.heading && <p class="heading">{this.heading}</p>}
            <div class="message">
              <slot />
            </div>
            <div class="actions">
              <slot name="actions" />
            </div>
          </div>

          {this.dismissible && (
            <button
              type="button"
              class="dismiss"
              aria-label={this.dismissLabel}
              onClick={this.handleDismiss}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </Host>
    );
  }

  /**
   * Each tone gets a distinct shape, not just a distinct colour — WCAG 1.4.1:
   * colour must not be the only means of conveying information.
   */
  private icon() {
    const common = {
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round' as const,
    };
    switch (this.tone) {
      case 'success':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
            <circle cx="8" cy="8" r="6.5" {...common} />
            <path d="M5 8.2l2 2L11 6" {...common} stroke-linejoin="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
            <path d="M8 1.8 15 14.2H1L8 1.8z" {...common} stroke-linejoin="round" />
            <path d="M8 6.2v3.4M8 11.4v.9" {...common} />
          </svg>
        );
      case 'danger':
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
            <circle cx="8" cy="8" r="6.5" {...common} />
            <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" {...common} />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
            <circle cx="8" cy="8" r="6.5" {...common} />
            <path d="M8 7.2v4M8 4.6v.9" {...common} />
          </svg>
        );
    }
  }
}
