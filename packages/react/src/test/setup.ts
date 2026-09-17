import '@testing-library/jest-dom/vitest';

/**
 * jsdom cannot run the Stencil bundle, so we register minimal stand-ins with
 * the same *contract* the adapters depend on: `value` and `error` as
 * properties, `setFocus()` as a method, and the `mrdInput` / `mrdBlur` custom
 * events.
 *
 * The stubs are deliberately dumb. What is under test here is the binding
 * layer — that an `mrdInput` event reaches React Hook Form, that `error` is
 * assigned as a property rather than an attribute, that error focus resolves to
 * something focusable. The components themselves are tested in a real browser
 * by Stencil's e2e run, where shadow DOM and `ElementInternals` actually exist.
 */

class MrdTextFieldStub extends HTMLElement {
  value = '';
  label = '';
  error?: string;

  connectedCallback() {
    // The real element delegates focus to its inner input. Here the host itself
    // has to be focusable, or `document.activeElement` never moves and the
    // focus-management assertions silently pass against `<body>`.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
  }

  async setFocus(options?: FocusOptions) {
    this.focus(options);
  }

  async selectText() {
    /* no selection model in the stub */
  }
}

class MrdBannerStub extends HTMLElement {
  static observedAttributes = ['live', 'tone'];

  connectedCallback() {
    this.syncRole();
  }

  attributeChangedCallback() {
    this.syncRole();
  }

  /**
   * Mirrors the real component: a banner announces itself only when `live` is
   * set, and it interrupts (`alert`) only when it carries an error. The real
   * element puts the role on a node inside its shadow root; on the host is the
   * closest jsdom can get, and it is the behaviour the adapter tests care about.
   */
  private syncRole() {
    if (!this.hasAttribute('live')) {
      this.removeAttribute('role');
      return;
    }
    this.setAttribute('role', this.getAttribute('tone') === 'danger' ? 'alert' : 'status');
  }
}

if (!customElements.get('mrd-text-field')) {
  customElements.define('mrd-text-field', MrdTextFieldStub);
}
if (!customElements.get('mrd-banner')) {
  customElements.define('mrd-banner', MrdBannerStub);
}
