import { newSpecPage } from '@stencil/core/testing';
import { MrdBanner } from './mrd-banner';

describe('mrd-banner', () => {
  const render = (html: string) => newSpecPage({ components: [MrdBanner], html });

  it('uses role=alert for danger, so errors interrupt', async () => {
    const page = await render('<mrd-banner tone="danger">Payment failed</mrd-banner>');
    expect(page.root!.shadowRoot!.querySelector('[part="base"]')!.getAttribute('role')).toBe(
      'alert',
    );
  });

  it('uses role=status for success, so it waits for a pause', async () => {
    const page = await render('<mrd-banner tone="success" live>Saved</mrd-banner>');
    expect(page.root!.shadowRoot!.querySelector('[part="base"]')!.getAttribute('role')).toBe(
      'status',
    );
  });

  it('is silent when rendered as part of the page', async () => {
    const page = await render('<mrd-banner tone="info">Scheduled maintenance</mrd-banner>');
    expect(page.root!.shadowRoot!.querySelector('[part="base"]')!.getAttribute('role')).toBeNull();
  });

  it('gives each tone a distinct icon shape, not only a colour', async () => {
    /*
     * Turn the page greyscale and the four tones must still be distinguishable —
     * WCAG 1.4.1. We compare path geometry rather than `innerHTML`, which
     * Stencil's mock DOM does not serialise for SVG.
     *
     * Rendered in sequence, not with Promise.all: `newSpecPage` mutates one
     * shared mock document, so concurrent calls clobber each other and every
     * assertion ends up reading the last page rendered. That failure mode is
     * quiet — the test passes for the wrong reason as often as it fails.
     */
    const shapes: string[] = [];

    for (const tone of ['info', 'success', 'warning', 'danger']) {
      const page = await render(`<mrd-banner tone="${tone}">x</mrd-banner>`);
      const paths = page.root!.shadowRoot!.querySelectorAll('.icon svg path');

      expect(paths.length).toBeGreaterThan(0);
      shapes.push(
        Array.from(paths)
          .map(path => path.getAttribute('d'))
          .join('|'),
      );
    }

    expect(new Set(shapes).size).toBe(4);
  });

  it('removes itself and emits on dismiss', async () => {
    const page = await render('<mrd-banner dismissible>Note</mrd-banner>');
    const spy = jest.fn();
    page.root!.addEventListener('mrdDismiss', spy);
    page.root!.shadowRoot!.querySelector<HTMLElement>('.dismiss')!.click();
    await page.waitForChanges();
    expect(spy).toHaveBeenCalled();
    expect(page.root!.shadowRoot!.querySelector('[part="base"]')).toBeNull();
  });
});
