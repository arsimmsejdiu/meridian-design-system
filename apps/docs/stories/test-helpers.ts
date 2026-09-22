import { userEvent, waitFor } from '@storybook/test';

/**
 * Click an `<mrd-button>` the way a user does.
 *
 * `userEvent.click(host)` dispatches the event on the custom element itself. A
 * real pointer lands on the `<button>` inside its shadow root — the host has no
 * click handler of its own, so a synthetic click on it reaches nothing and
 * `mrdClick` never fires. The test then reports "expected 1 call, got 0" and
 * looks like a component bug.
 *
 * Resolving to the inner control keeps the test honest about what it is
 * simulating, and keeps the component free of a listener that exists only to
 * make tests pass.
 */
export async function clickButton(host: Element | null): Promise<void> {
  if (!host) throw new Error('clickButton: no element given.');

  await waitFor(() => {
    if (!host.shadowRoot) throw new Error('Custom element has not upgraded yet.');
  });

  const control = host.shadowRoot?.querySelector<HTMLElement>('button, a');
  if (!control) throw new Error('clickButton: no button or anchor inside the shadow root.');

  await userEvent.click(control);
}

/** The deepest focused element, descending through shadow roots. */
export function deepActiveElement(): Element | null {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}
