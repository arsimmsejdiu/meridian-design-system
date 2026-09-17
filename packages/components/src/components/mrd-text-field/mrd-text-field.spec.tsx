import { newSpecPage } from '@stencil/core/testing';
import { MrdTextField } from './mrd-text-field';

describe('mrd-text-field', () => {
  const render = (html: string) => newSpecPage({ components: [MrdTextField], html });

  it('associates the label with the input', async () => {
    const page = await render('<mrd-text-field label="Email"></mrd-text-field>');
    const sr = page.root!.shadowRoot!;
    const label = sr.querySelector('label')!;
    const input = sr.querySelector('input')!;
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
    expect(label.textContent).toContain('Email');
  });

  it('keeps the label available to AT when hidden', async () => {
    const page = await render('<mrd-text-field label="Search" hide-label></mrd-text-field>');
    const label = page.root!.shadowRoot!.querySelector('label')!;
    expect(label.className).toContain('visually-hidden');
    expect(label.textContent).toContain('Search');
  });

  it('describes the input with the hint', async () => {
    const page = await render(
      '<mrd-text-field label="Email" hint="Receipts only"></mrd-text-field>',
    );
    const sr = page.root!.shadowRoot!;
    const id = sr.querySelector('input')!.getAttribute('aria-describedby')!;
    expect(sr.querySelector(`#${id}`)!.textContent).toBe('Receipts only');
  });

  it('reads hint before error in describedby order', async () => {
    const page = await render(
      '<mrd-text-field label="Email" hint="Receipts only" error="Enter a valid email"></mrd-text-field>',
    );
    const sr = page.root!.shadowRoot!;
    const ids = sr.querySelector('input')!.getAttribute('aria-describedby')!.split(' ');
    expect(sr.querySelector(`#${ids[0]}`)!.textContent).toBe('Receipts only');
    expect(sr.querySelector(`#${ids[1]}`)!.textContent).toContain('Enter a valid email');
  });

  it('marks the input invalid only when an error is present', async () => {
    const page = await render('<mrd-text-field label="Email"></mrd-text-field>');
    expect(page.root!.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).toBeNull();

    page.root!.setAttribute('error', 'Required');
    await page.waitForChanges();
    expect(page.root!.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('announces the error through role=alert', async () => {
    const page = await render('<mrd-text-field label="Email" error="Required"></mrd-text-field>');
    expect(page.root!.shadowRoot!.querySelector('[role="alert"]')!.textContent).toContain(
      'Required',
    );
  });

  it('emits mrdInput on typing', async () => {
    const page = await render('<mrd-text-field label="Email"></mrd-text-field>');
    const spy = jest.fn();
    page.root!.addEventListener('mrdInput', spy);
    const input = page.root!.shadowRoot!.querySelector('input')!;
    input.value = 'a@b.co';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();
    expect(spy).toHaveBeenCalled();
  });
});
