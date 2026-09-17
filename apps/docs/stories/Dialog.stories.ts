import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, waitFor } from '@storybook/test';

const meta: Meta = {
  title: 'Components/Dialog',
  component: 'mrd-dialog',
  parameters: {
    docs: {
      description: {
        component: [
          'A modal dialog built on the native `<dialog>` element, so the top layer,',
          'inertness of the page behind it and Escape handling come from the',
          'browser rather than from a `z-index` arms race.',
          '',
          'What the component adds is the part browsers still get wrong or leave to',
          'you: focus moves into the dialog on open and returns to the element that',
          'opened it on close (WCAG 2.4.3), focus is trapped through the shadow',
          'boundary, the background stops scrolling without the page shifting, and',
          '`persistent` opts out of light-dismiss for flows where an accidental',
          'Escape would lose work.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    persistent: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
  },
  args: { size: 'md', heading: 'Delete this invoice?' },
};

export default meta;
type Story = StoryObj;

const open = (id: string) => () =>
  (document.getElementById(id) as HTMLElement & { show(): Promise<void> }).show();

export const Playground: Story = {
  render: args => html`
    <mrd-button @mrdClick=${open('dlg-playground')}>Open dialog</mrd-button>

    <mrd-dialog
      id="dlg-playground"
      heading=${args.heading}
      size=${args.size}
      ?persistent=${args.persistent}
      ?hide-close-button=${args.hideCloseButton}
    >
      <p>
        Invoice 2041 will be removed from this project. Anyone with the link will stop being able to
        open it.
      </p>
      <div slot="footer" style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <mrd-button
          variant="ghost"
          @mrdClick=${() => (document.getElementById('dlg-playground') as any).hide()}
        >
          Cancel
        </mrd-button>
        <mrd-button variant="danger">Delete invoice</mrd-button>
      </div>
    </mrd-dialog>
  `,
};

export const Persistent: Story = {
  render: () => html`
    <mrd-button @mrdClick=${open('dlg-persistent')}>Start migration</mrd-button>

    <mrd-dialog id="dlg-persistent" heading="Migration in progress" persistent hide-close-button>
      <p>Moving 1,204 records. Closing this window would leave the import half-applied.</p>
      <div slot="footer">
        <mrd-button loading loading-label="Migrating records">Migrating</mrd-button>
      </div>
    </mrd-dialog>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          '`persistent` disables Escape and backdrop dismissal. Use it only when',
          'dismissing would destroy work — a dialog you cannot leave is a trap, and',
          'the one thing worse than losing an import is not being able to get out',
          'of the screen telling you about it. There must always be a visible way',
          'to finish.',
        ].join(' '),
      },
    },
  },
};

export const WithForm: Story = {
  render: () => html`
    <mrd-button @mrdClick=${open('dlg-form')}>Invite a colleague</mrd-button>

    <mrd-dialog id="dlg-form" heading="Invite a colleague" initial-focus="#invite-email">
      <div style="display:grid; gap:1rem;">
        <mrd-text-field
          id="invite-email"
          label="Email address"
          type="email"
          autocomplete="email"
          hint="They'll get read access to this project."
        ></mrd-text-field>
      </div>
      <div slot="footer" style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <mrd-button
          variant="ghost"
          @mrdClick=${() => (document.getElementById('dlg-form') as any).hide()}
        >
          Cancel
        </mrd-button>
        <mrd-button>Send invitation</mrd-button>
      </div>
    </mrd-dialog>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          '`initial-focus` takes a selector. By default focus lands on the dialog',
          'container so the heading is announced first; point it at a field only',
          'when the dialog exists to collect that one value, since skipping the',
          'heading costs a screen-reader user the context for it.',
        ].join(' '),
      },
    },
  },
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      ${['sm', 'md', 'lg', 'full'].map(
        size => html`
          <mrd-button variant="secondary" @mrdClick=${open(`dlg-${size}`)}>${size}</mrd-button>
          <mrd-dialog id="dlg-${size}" heading="Size: ${size}" size=${size}>
            <p>On narrow viewports every size becomes a full-height sheet.</p>
          </mrd-dialog>
        `,
      )}
    </div>
  `,
};

/**
 * Interaction test: the two things that actually break in hand-rolled modals —
 * focus going in, and focus coming back out to where it started.
 */
export const ReturnsFocusOnClose: Story = {
  render: () => html`
    <mrd-button id="opener" @mrdClick=${open('dlg-focus')}>Open dialog</mrd-button>
    <mrd-dialog id="dlg-focus" heading="Focus behaviour">
      <p>Press Escape.</p>
    </mrd-dialog>
  `,
  play: async ({ canvasElement }) => {
    const opener = canvasElement.querySelector('#opener')!;
    const dialog = document.getElementById('dlg-focus') as HTMLElement & { open: boolean };

    await userEvent.click(opener);
    await waitFor(() => expect(dialog.open).toBe(true));
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(dialog.open).toBe(false));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  },
};

export const EscapeIsIgnoredWhenPersistent: Story = {
  render: () => html`
    <mrd-button id="opener-p" @mrdClick=${open('dlg-persist-test')}>Open</mrd-button>
    <mrd-dialog id="dlg-persist-test" heading="Cannot dismiss" persistent hide-close-button>
      <p>Escape does nothing here.</p>
    </mrd-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = document.getElementById('dlg-persist-test') as HTMLElement & { open: boolean };

    await userEvent.click(canvasElement.querySelector('#opener-p')!);
    await waitFor(() => expect(dialog.open).toBe(true));

    await userEvent.keyboard('{Escape}');
    await new Promise(r => setTimeout(r, 100));

    await expect(dialog.open).toBe(true);
    await (dialog as any).hide();
  },
};
