/**
 * jsdom shims for the Stencil spec runner.
 *
 * jsdom implements neither `<dialog>`'s modal behaviour nor `matchMedia`, and a
 * component that legitimately uses both would otherwise fail in unit tests for
 * reasons that have nothing to do with the component. We stub the platform
 * rather than branching inside the component — production code should not know
 * it is being tested.
 */

/* ---------------------------------------------------------------- <dialog> */

if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) {
  const openFlag = new WeakMap<HTMLElement, boolean>();

  Object.defineProperty(HTMLElement.prototype, 'open', {
    configurable: true,
    get(this: HTMLElement) {
      return openFlag.get(this) ?? this.hasAttribute('open');
    },
    set(this: HTMLElement, value: boolean) {
      openFlag.set(this, Boolean(value));
      if (value) this.setAttribute('open', '');
      else this.removeAttribute('open');
    },
  });

  HTMLElement.prototype.showModal = function showModal(this: HTMLElement) {
    openFlag.set(this, true);
    this.setAttribute('open', '');
    // The real implementation makes the dialog the top layer; the only part
    // our tests care about is that `open` flips and `close` fires an event.
  };

  HTMLElement.prototype.show = function show(this: HTMLElement) {
    openFlag.set(this, true);
    this.setAttribute('open', '');
  };

  HTMLElement.prototype.close = function close(this: HTMLElement, returnValue?: string) {
    if (!openFlag.get(this) && !this.hasAttribute('open')) return;
    openFlag.set(this, false);
    this.removeAttribute('open');
    if (returnValue !== undefined) (this as HTMLDialogElement).returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}

/* -------------------------------------------------------------- matchMedia */

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

/* -------------------------------------------- ResizeObserver / scrollTo etc */

if (!('ResizeObserver' in window)) {
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}

/**
 * Deterministic ids. Components derive describedby/labelledby ids from
 * Math.random(), which would make snapshots churn on every run.
 */
let seed = 0;
const random = Math.random;
beforeEach(() => {
  seed = 0;
  Math.random = () => {
    seed += 1;
    return seed / 100;
  };
});
afterEach(() => {
  Math.random = random;
});

export {};
