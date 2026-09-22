import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, waitFor } from '@storybook/test';

const meta: Meta = {
  title: 'Components/Banner',
  component: 'mrd-banner',
  parameters: {
    docs: {
      description: {
        component: [
          'An inline message. The tone carries meaning, so it is never carried by',
          'colour alone: each tone has a distinct icon and, where it matters, a',
          'distinct role in the accessibility tree (WCAG 1.4.1).',
          '',
          'The `live` flag is the part worth reading twice. A banner rendered with',
          'the page needs no live region — a screen reader meets it in the normal',
          'reading order. A banner injected *after* a user action does, or the user',
          'never learns it appeared. Setting `live` on a static banner is not a',
          'harmless default: it makes the page announce itself on load.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    tone: { control: 'select', options: ['info', 'success', 'warning', 'danger'] },
    dismissible: { control: 'boolean' },
    live: { control: 'boolean' },
  },
  args: { tone: 'info', heading: 'Scheduled maintenance' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <mrd-banner
      tone=${args.tone}
      heading=${args.heading ?? ''}
      ?dismissible=${args.dismissible}
      ?live=${args.live}
    >
      The service will be unavailable on Sunday between 02:00 and 04:00 CET.
    </mrd-banner>
  `,
};

export const Tones: Story = {
  render: () => html`
    <div style="display:grid; gap:0.75rem;">
      <mrd-banner tone="info" heading="Scheduled maintenance">
        Sunday, 02:00–04:00 CET.
      </mrd-banner>
      <mrd-banner tone="success" heading="Invoice sent">
        A copy has been emailed to you.
      </mrd-banner>
      <mrd-banner tone="warning" heading="Your trial ends in 3 days">
        Add a payment method to keep your projects.
      </mrd-banner>
      <mrd-banner tone="danger" heading="Payment failed">
        Your card was declined. Update it to restore access.
      </mrd-banner>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'Four tones, four icons. Turn the page greyscale and the meaning survives —',
          'that is the test, not whether the palette looks right.',
        ].join(' '),
      },
    },
  },
};

export const Dismissible: Story = {
  render: () => html`
    <mrd-banner tone="info" heading="New: keyboard shortcuts" dismissible>
      Press <kbd>?</kbd> anywhere to see the list.
      <div slot="actions">
        <mrd-button size="sm" variant="secondary" href="/docs/shortcuts">Read more</mrd-button>
      </div>
    </mrd-banner>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'The dismiss button carries a real accessible name (`dismiss-label`), not',
          'a bare ×. When a banner is dismissed, focus moves to the next sensible',
          'element rather than being dropped on `<body>`, which would send a',
          'keyboard user back to the top of the page.',
        ].join(' '),
      },
    },
  },
};

export const Live: Story = {
  render: () => html`
    <div style="display:grid; gap:0.75rem; justify-items:start;">
      <mrd-button
        @mrdClick=${() => {
          const slot = document.getElementById('live-slot')!;
          slot.innerHTML = '';
          const banner = document.createElement('mrd-banner');
          banner.setAttribute('tone', 'success');
          banner.setAttribute('heading', 'Settings saved');
          banner.setAttribute('live', '');
          banner.textContent = 'Your changes are live.';
          slot.appendChild(banner);
        }}
      >
        Save settings
      </mrd-button>
      <div id="live-slot"></div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'A confirmation that appears in response to an action uses',
          '`role="status"` — polite, announced once the current utterance finishes.',
          'Errors use `role="alert"`, which interrupts. Reserve interruption for',
          'messages the user has to act on.',
        ].join(' '),
      },
    },
  },
};

export const AsErrorSummary: Story = {
  render: () => html`
    <form
      style="display:grid; gap:1rem; max-width:24rem;"
      @submit=${(e: Event) => e.preventDefault()}
    >
      <mrd-banner tone="danger" heading="There is a problem" live>
        <ul style="margin:0; padding-left:1.25rem; line-height:1.9;">
          <li>
            <a href="#summary-email" style="display:inline-block; padding:0.25rem 0;"
              >Enter an email address</a
            >
          </li>
          <li>
            <a href="#summary-name" style="display:inline-block; padding:0.25rem 0;"
              >Enter your name</a
            >
          </li>
        </ul>
      </mrd-banner>

      <!--
        The fields are part of the story, not decoration. A summary whose links
        point at nothing is not the pattern — it is the shape of the pattern, and
        axe says so: an in-page link with no target is a real failure for anyone
        who follows it.
      -->
      <mrd-text-field
        id="summary-email"
        label="Email address"
        type="email"
        error="Enter an email address"
      ></mrd-text-field>
      <mrd-text-field id="summary-name" label="Full name" error="Enter your name"></mrd-text-field>
    </form>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'The pattern `@meridian/react`’s `MeridianForm` renders after a failed',
          'submit: one focusable region listing every problem, each entry linking to',
          'its field. Without it a screen-reader user has to walk the whole form',
          'again to find what went wrong.',
        ].join(' '),
      },
    },
  },
};

/** Interaction test: the right role for the right tone. */
export const RolesMatchTone: Story = {
  render: () => html`
    <div style="display:grid; gap:0.75rem;">
      <mrd-banner id="b-status" tone="success" live heading="Saved">Done.</mrd-banner>
      <mrd-banner id="b-alert" tone="danger" live heading="Failed">Try again.</mrd-banner>
      <mrd-banner id="b-static" tone="info" heading="FYI">Static.</mrd-banner>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const roleOf = (id: string) => {
      const host = canvasElement.querySelector(`#${id}`)!;
      return host.shadowRoot!.querySelector('[role]')?.getAttribute('role') ?? null;
    };

    await waitFor(() => expect(canvasElement.querySelector('#b-status')!.shadowRoot).toBeTruthy());

    await expect(roleOf('b-status')).toBe('status');
    await expect(roleOf('b-alert')).toBe('alert');
    await expect(roleOf('b-static')).toBeNull();
  },
};

export const DismissEmitsEvent: Story = {
  render: () => html`
    <mrd-banner id="b-dismiss" tone="info" heading="Dismiss me" dismissible> Content. </mrd-banner>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('#b-dismiss')!;
    await waitFor(() => expect(host.shadowRoot).toBeTruthy());

    let dismissed = 0;
    host.addEventListener('mrdDismiss', () => (dismissed += 1));

    await userEvent.click(host.shadowRoot!.querySelector('button')!);
    await waitFor(() => expect(dismissed).toBe(1));
  },
};
