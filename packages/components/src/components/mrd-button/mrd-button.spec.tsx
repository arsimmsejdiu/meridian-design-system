import { newSpecPage } from '@stencil/core/testing';
import { MrdButton } from './mrd-button';

describe('mrd-button', () => {
  const render = (html: string) => newSpecPage({ components: [MrdButton], html });

  it('renders a native button by default', async () => {
    const page = await render('<mrd-button>Save</mrd-button>');
    const el = page.root!.shadowRoot!.querySelector('[part="base"]')!;
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
  });

  it('renders an anchor when href is set, so middle-click and copy-link work', async () => {
    const page = await render('<mrd-button href="/pricing">Pricing</mrd-button>');
    const el = page.root!.shadowRoot!.querySelector('[part="base"]')!;
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/pricing');
  });

  it('adds rel="noreferrer noopener" for target=_blank', async () => {
    const page = await render(
      '<mrd-button href="https://example.com" target="_blank">Docs</mrd-button>',
    );
    const el = page.root!.shadowRoot!.querySelector('[part="base"]')!;
    expect(el.getAttribute('rel')).toBe('noreferrer noopener');
  });

  it('falls back to a disabled button rather than a disabled link', async () => {
    const page = await render('<mrd-button href="/x" disabled>Nope</mrd-button>');
    const el = page.root!.shadowRoot!.querySelector('[part="base"]')!;
    expect(el.tagName).toBe('BUTTON');
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('stays focusable while loading and reports aria-busy', async () => {
    const page = await render('<mrd-button loading>Saving</mrd-button>');
    const el = page.root!.shadowRoot!.querySelector('[part="base"]')!;
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(page.root!.shadowRoot!.querySelector('[role="status"]')!.textContent).toBe('Loading');
  });

  it('does not emit while disabled', async () => {
    const page = await render('<mrd-button disabled>Save</mrd-button>');
    const spy = jest.fn();
    page.root!.addEventListener('mrdClick', spy);
    page.root!.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.click();
    await page.waitForChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not emit while loading', async () => {
    const page = await render('<mrd-button loading>Save</mrd-button>');
    const spy = jest.fn();
    page.root!.addEventListener('mrdClick', spy);
    page.root!.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.click();
    await page.waitForChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits mrdClick when activated', async () => {
    const page = await render('<mrd-button>Save</mrd-button>');
    const spy = jest.fn();
    page.root!.addEventListener('mrdClick', spy);
    page.root!.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.click();
    await page.waitForChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('exposes an accessible name via label for icon-only use', async () => {
    const page = await render(
      '<mrd-button label="Delete row 4"><span slot="start">x</span></mrd-button>',
    );
    expect(page.root!.shadowRoot!.querySelector('[part="base"]')!.getAttribute('aria-label')).toBe(
      'Delete row 4',
    );
  });
});
