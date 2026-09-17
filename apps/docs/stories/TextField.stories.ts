import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within, waitFor } from '@storybook/test';

const meta: Meta = {
  title: 'Components/Text field',
  component: 'mrd-text-field',
  parameters: {
    docs: {
      description: {
        component: [
          'A labelled text input. The input is the easy part — the value of the',
          'component is the wiring around it: a real `<label for>`, a stable',
          '`aria-describedby` order, `aria-invalid` derived from the error rather',
          'than tracked separately, and `ElementInternals` so the field submits',
          'with a native form despite living in a shadow root.',
        ].join(' '),
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    hideLabel: { control: 'boolean' },
    error: { control: 'text' },
    hint: { control: 'text' },
  },
  args: { label: 'Email address', type: 'email', size: 'md' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <mrd-text-field
      label=${args.label}
      type=${args.type}
      size=${args.size}
      hint=${args.hint ?? ''}
      error=${args.error ?? ''}
      placeholder=${args.placeholder ?? ''}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      ?hide-label=${args.hideLabel}
    ></mrd-text-field>
  `,
};

export const WithHint: Story = {
  render: () => html`
    <mrd-text-field
      label="Email address"
      type="email"
      autocomplete="email"
      hint="We'll only use this to send your receipt."
    ></mrd-text-field>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'Hint text is wired through `aria-describedby`, so it is announced as',
          'part of the field rather than being visual-only. Put the hint *above*',
          'the risk of getting it wrong, not in a tooltip the user has to find.',
        ].join(' '),
      },
    },
  },
};

export const WithError: Story = {
  render: () => html`
    <mrd-text-field
      label="Email address"
      type="email"
      value="arsim@"
      hint="We'll only use this to send your receipt."
      error="Enter an email address in the format name@example.com"
    ></mrd-text-field>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'Error text is announced through `role="alert"` and appended **after**',
          'the hint in `aria-describedby`, so the hint reads as context for the',
          'error. The message says what to do, not that something is "invalid".',
        ].join(' '),
      },
    },
  },
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:grid; gap:1rem; max-width:22rem;">
      <mrd-text-field size="sm" label="Small"></mrd-text-field>
      <mrd-text-field size="md" label="Medium"></mrd-text-field>
      <mrd-text-field size="lg" label="Large"></mrd-text-field>
    </div>
  `,
};

export const WithAffixes: Story = {
  render: () => html`
    <div style="display:grid; gap:1rem; max-width:22rem;">
      <mrd-text-field label="Search orders" type="search">
        <span slot="start" aria-hidden="true">⌕</span>
      </mrd-text-field>
      <mrd-text-field label="Amount" inputmode="decimal" hint="Swiss francs.">
        <span slot="start" aria-hidden="true">CHF</span>
      </mrd-text-field>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          'Affixes are decorative and hidden from assistive technology. A currency',
          'symbol that matters semantically belongs in the label or the hint, where',
          'it is actually announced.',
        ].join(' '),
      },
    },
  },
};

export const HiddenLabel: Story = {
  render: () => html`
    <form
      style="display:flex; gap:0.5rem; align-items:flex-end;"
      @submit=${(e: Event) => e.preventDefault()}
    >
      <mrd-text-field
        label="Search products"
        type="search"
        hide-label
        placeholder="Search products"
      ></mrd-text-field>
      <mrd-button type="submit">Search</mrd-button>
    </form>
  `,
  parameters: {
    docs: {
      description: {
        story: [
          '`hide-label` keeps the label in the accessibility tree and removes it',
          'visually — it never removes it outright. A placeholder is not a label:',
          'it disappears the moment the user types, and several browsers render it',
          'below 3:1 contrast.',
        ].join(' '),
      },
    },
  },
};

/** Interaction test: the error is exposed to AT, not just painted red. */
export const ErrorIsAnnounced: Story = {
  render: () => html`
    <mrd-text-field
      label="Email address"
      error="Enter an email address in the format name@example.com"
    ></mrd-text-field>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('mrd-text-field')!;
    await waitFor(() => expect(host.shadowRoot).toBeTruthy());

    const input = host.shadowRoot!.querySelector('input')!;
    await expect(input.getAttribute('aria-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby')!;
    const message = host.shadowRoot!.getElementById(describedBy.split(' ').pop()!)!;
    await expect(message.getAttribute('role')).toBe('alert');
    await expect(message.textContent).toContain('name@example.com');
  },
};

/** Interaction test: clicking the label focuses the input across the shadow boundary. */
export const LabelFocusesInput: Story = {
  render: () => html`<mrd-text-field label="Full name"></mrd-text-field>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('mrd-text-field')!;
    await waitFor(() => expect(host.shadowRoot).toBeTruthy());

    const label = host.shadowRoot!.querySelector('label')!;
    await userEvent.click(label);

    await expect(host.shadowRoot!.activeElement).toBe(host.shadowRoot!.querySelector('input'));
  },
};

/** Interaction test: typing emits `mrdInput` with the new value. */
export const EmitsInputEvents: Story = {
  render: () => html`<mrd-text-field label="City"></mrd-text-field>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('mrd-text-field')!;
    await waitFor(() => expect(host.shadowRoot).toBeTruthy());

    const seen: string[] = [];
    host.addEventListener('mrdInput', (e: Event) =>
      seen.push((e as CustomEvent<{ value: string }>).detail.value),
    );

    await userEvent.type(host.shadowRoot!.querySelector('input')!, 'Zug');

    await waitFor(() => expect(seen.at(-1)).toBe('Zug'));
    await expect(within(canvasElement).queryByText('undefined')).toBeNull();
  },
};
