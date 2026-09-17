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
    const shapes = await Promise.all(
      ['info', 'success', 'warning', 'danger'].map(async tone => {
        const page = await render(`<mrd-banner tone="${tone}">x</mrd-banner>`);
        return page.root!.shadowRoot!.querySelector('.icon svg')!.innerHTML;
      }),
    );
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
