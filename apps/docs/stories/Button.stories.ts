import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within, fn } from '@storybook/test';

const meta: Meta = {
  title: 'Components/Button',
  component: 'mrd-button',
  parameters: {
    docs: {
      description: {
        component: [
          'Renders a `<button>`, or an `<a>` when `href` is set.',
          '',
          'That distinction is not cosmetic. Screen readers announce the two',
          'differently, and only a real anchor supports middle-click, "open in',
          'new tab" and copy-link. A "button" that navigates is a bug.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    label: { control: 'text', description: 'Accessible name. Required for icon-only buttons.' },
  },
  args: { variant: 'primary', size: 'md', disabled: false, loading: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <mrd-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
      ?full-width=${args.fullWidth}
      label=${args.label ?? ''}
    >
      ${args.slot ?? 'Save changes'}
    </mrd-button>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <mrd-button variant="primary">Primary</mrd-button>
      <mrd-button variant="secondary">Secondary</mrd-button>
      <mrd-button variant="danger">Delete</mrd-button>
      <mrd-button variant="ghost">Ghost</mrd-button>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'One primary action per view. If everything is primary, nothing is.',
      },
    },
  },
};

export const Loading: Story = {
  render: () => html`
    <div style="display:flex; gap:0.5rem;">
      <mrd-button loading>Saving</mrd-button>
      <mrd-button loading variant="secondary" loading-label="Uploading file">Upload</mrd-button>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'A loading button stays **focusable** and sets `aria-busy`, rather than',
          'becoming disabled. Disabling a focused control throws the user out of',
          'the tab order mid-flow, and the browser gives no indication why.',
        ].join(' '),
      },
    },
  },
};

export const AsLink: Story = {
  render: () => html`
    <div style="display:flex; gap:0.5rem;">
      <mrd-button href="/pricing" variant="secondary">Pricing</mrd-button>
      <mrd-button href="https://example.com" target="_blank" variant="ghost">
        Documentation
        <span slot="end" aria-hidden="true">↗</span>
      </mrd-button>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: '`target="_blank"` adds `rel="noreferrer noopener"` automatically.',
      },
    },
  },
};

export const IconOnly: Story = {
  render: () => html`
    <mrd-button label="Delete invoice 2041" variant="ghost">
      <span slot="start" aria-hidden="true">🗑</span>
    </mrd-button>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'An icon-only button **must** carry `label`. Prefer a name that is unique',
          'in context — "Delete invoice 2041", not "Delete" repeated down a table,',
          'so a screen-reader user listing the buttons can tell them apart.',
        ].join(' '),
      },
    },
  },
};

export const MinimumTargetSize: Story = {
  render: () => html`
    <div style="display:flex; gap:0.5rem; align-items:center;">
      <mrd-button size="sm">Small</mrd-button>
      <span style="font-size:0.875rem; color:var(--mrd-theme-text-muted)">
        Visually 32px tall, but the pointer target is 44px — WCAG 2.2 SC 2.5.8.
      </span>
    </div>
  `,
};

/** Interaction test — runs in CI on every story via the test runner. */
export const ActivatesOnce: Story = {
  args: { onMrdClick: fn() },
  render: args => html`<mrd-button @mrdClick=${args.onMrdClick}>Confirm</mrd-button>`,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByText('Confirm');

    await userEvent.click(button);
    await expect(args.onMrdClick).toHaveBeenCalledTimes(1);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(args.onMrdClick).toHaveBeenCalledTimes(2);
  },
};

export const DoesNotActivateWhenLoading: Story = {
  args: { onMrdClick: fn() },
  render: args => html`<mrd-button loading @mrdClick=${args.onMrdClick}>Saving</mrd-button>`,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByText('Saving'));
    await expect(args.onMrdClick).not.toHaveBeenCalled();
  },
};
