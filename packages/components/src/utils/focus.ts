/**
 * Focus utilities.
 *
 * The selector below is the pragmatic version of "focusable": it is the set of
 * elements browsers put in the tab order, minus the ones that are present but
 * unreachable. `inert` is checked because a container can remove its whole
 * subtree from the tab order without any of the individual elements changing.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'details > summary:first-of-type',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

const isVisible = (el: HTMLElement): boolean => {
  if (el.hasAttribute('inert') || el.closest('[inert]')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  // offsetParent is null for display:none, but also for position:fixed —
  // hence the rect fallback.
  if (el.offsetParent !== null) return true;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

/**
 * Focusable descendants in tab order, crossing both shadow boundaries **and**
 * slots.
 *
 * A design system built on Web Components cannot use a flat `querySelectorAll`
 * here, and descending into shadow roots alone is not enough either. Slotted
 * content is the case that bites: `<mrd-dialog>` renders `<slot name="footer">`
 * inside its shadow root, but the buttons the consumer passed are children of
 * the *host*, in the light DOM. A shadow-only walk never reaches them, so the
 * focus trap sees one focusable element — its own close button — and lets Tab
 * walk straight out of the dialog past everything the consumer put in it.
 *
 * Nodes are visited in composed-tree order, so the result matches the order a
 * user actually tabs through.
 */
export function getFocusableElements(root: ParentNode): HTMLElement[] {
  const found: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  const consider = (el: HTMLElement) => {
    if (seen.has(el)) return;
    seen.add(el);
    if (el.matches(FOCUSABLE) && isVisible(el)) found.push(el);
  };

  const walk = (node: ParentNode) => {
    for (const el of Array.from(node.children) as HTMLElement[]) {
      if (el instanceof HTMLSlotElement) {
        // Follow the slot to whatever the consumer actually passed. Falls back
        // to the slot's own children, which are the default content.
        const assigned = el.assignedElements({ flatten: true }) as HTMLElement[];
        for (const child of assigned.length
          ? assigned
          : (Array.from(el.children) as HTMLElement[])) {
          consider(child);
          if (child.shadowRoot) walk(child.shadowRoot);
          walk(child);
        }
        continue;
      }

      consider(el);
      if (el.shadowRoot) walk(el.shadowRoot);
      walk(el);
    }
  };

  walk(root);
  return found;
}

/**
 * Keeps Tab inside a container.
 *
 * Only needed where the platform cannot help: a non-modal dialog, a popover on
 * a browser without top-layer support. `dialog.showModal()` already makes the
 * rest of the document inert, so prefer that and leave this unused.
 */
export class FocusTrap {
  private readonly container: HTMLElement;
  /** Where slotted content actually lives, when the container is in a shadow root. */
  private readonly host: HTMLElement | undefined;
  private active = false;

  constructor(container: HTMLElement, host?: HTMLElement) {
    this.container = container;
    this.host = host;
  }

  /** Focusables in the container, plus anything slotted into it from the host. */
  private focusable(): HTMLElement[] {
    const inContainer = getFocusableElements(this.container);
    if (!this.host) return inContainer;

    const merged = new Set(inContainer);
    for (const el of getFocusableElements(this.host)) merged.add(el);
    return Array.from(merged);
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('keydown', this.onKeyDown, true);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const focusable = this.focusable();
    if (focusable.length === 0) {
      // Nothing to focus: keep focus on the container rather than escaping.
      event.preventDefault();
      this.container.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const activeEl = this.deepActiveElement();

    if (event.shiftKey && activeEl === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /** `document.activeElement` stops at the shadow boundary; descend through it. */
  private deepActiveElement(): Element | null {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }
}

/**
 * Roving tabindex — one stop in the tab order for the whole group, arrow keys
 * to move within it. The pattern behind tabs, toolbars, menus and radio groups.
 */
export class RovingTabindex {
  constructor(
    private readonly items: () => HTMLElement[],
    private readonly options: { orientation?: 'horizontal' | 'vertical'; loop?: boolean } = {},
  ) {}

  /** Returns the index to activate, or null if the key is not ours. */
  handleKey(event: KeyboardEvent, currentIndex: number): number | null {
    const { orientation = 'horizontal', loop = true } = this.options;
    const items = this.items();
    const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

    let index: number | null = null;
    if (event.key === next) index = currentIndex + 1;
    else if (event.key === prev) index = currentIndex - 1;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = items.length - 1;
    else return null;

    if (index >= items.length) index = loop ? 0 : items.length - 1;
    if (index < 0) index = loop ? items.length - 1 : 0;

    event.preventDefault();
    return index;
  }
}
