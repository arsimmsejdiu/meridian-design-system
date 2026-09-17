import { newE2EPage } from '@stencil/core/testing';

/**
 * Dialog behaviour is almost entirely focus and keyboard behaviour, so it is
 * tested in a real browser rather than the spec renderer.
 */
describe('mrd-dialog (e2e)', () => {
  const page = async () =>
    newE2EPage({
      html: `
        <button id="trigger">Open</button>
        <mrd-dialog heading="Delete account">
          <p>This cannot be undone.</p>
          <div slot="footer">
            <mrd-button id="cancel" variant="secondary">Cancel</mrd-button>
            <mrd-button id="confirm" variant="danger">Delete</mrd-button>
          </div>
        </mrd-dialog>`,
    });

  it('moves focus to the heading on open, not the close button', async () => {
    const p = await page();
    const dialog = await p.find('mrd-dialog');
    await dialog.callMethod('show');
    await p.waitForChanges();
    await new Promise(r => setTimeout(r, 50));

    const focused = await p.evaluate(() => {
      let el = document.activeElement;
      while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
      return el?.getAttribute('data-dialog-heading') !== null ? 'heading' : el?.className;
    });
    expect(focused).toBe('heading');
  });

  it('returns focus to the trigger on close', async () => {
    const p = await page();
    await p.evaluate(() => (document.getElementById('trigger') as HTMLElement).focus());
    const dialog = await p.find('mrd-dialog');
    await dialog.callMethod('show');
    await p.waitForChanges();
    await dialog.callMethod('hide');
    await p.waitForChanges();

    const id = await p.evaluate(() => document.activeElement?.id);
    expect(id).toBe('trigger');
  });

  it('closes on Escape and reports the reason', async () => {
    const p = await page();
    const dialog = await p.find('mrd-dialog');
    const closed = await dialog.spyOnEvent('mrdClose');
    await dialog.callMethod('show');
    await p.waitForChanges();
    await p.keyboard.press('Escape');
    await p.waitForChanges();

    expect(closed).toHaveReceivedEventDetail({ reason: 'escape' });
  });

  it('ignores Escape when persistent', async () => {
    const p = await page();
    const dialog = await p.find('mrd-dialog');
    dialog.setProperty('persistent', true);
    await p.waitForChanges();
    await dialog.callMethod('show');
    await p.waitForChanges();
    await p.keyboard.press('Escape');
    await p.waitForChanges();

    expect(await dialog.getProperty('open')).toBe(true);
  });

  it('keeps Tab inside the dialog', async () => {
    const p = await page();
    const dialog = await p.find('mrd-dialog');
    await dialog.callMethod('show');
    await p.waitForChanges();

    for (let i = 0; i < 8; i++) await p.keyboard.press('Tab');

    const inside = await p.evaluate(() => {
      let el = document.activeElement;
      while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
      return Boolean(el?.closest('mrd-dialog')) || el?.getRootNode() instanceof ShadowRoot;
    });
    expect(inside).toBe(true);
  });

  it('does not shift layout when locking scroll', async () => {
    const p = await page();
    await p.evaluate(() => {
      document.body.style.height = '300vh';
    });
    const before = await p.evaluate(() => document.documentElement.clientWidth);
    const dialog = await p.find('mrd-dialog');
    await dialog.callMethod('show');
    await p.waitForChanges();
    const after = await p.evaluate(() => document.documentElement.clientWidth);

    expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
  });
});
