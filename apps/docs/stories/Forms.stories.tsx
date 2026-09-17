import type { Meta, StoryObj } from '@storybook/web-components';
import { expect, userEvent, within, waitFor } from '@storybook/test';
import { createElement, useState, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFormContext, useFieldArray, type Control } from 'react-hook-form';
import { z } from 'zod';
import { MeridianForm, FormTextField } from '@meridian/react';

/* ------------------------------------------------------------------ mount */

const roots = new WeakMap<HTMLElement, Root>();

/** Mount a React element into a fresh container, reusing the root on re-render. */
function mountReact(node: React.ReactNode) {
  const container = document.createElement('div');
  container.style.maxWidth = '30rem';

  // Storybook re-renders on every arg change; creating a second root on the
  // same node is the classic double-mount warning, hence the WeakMap.
  queueMicrotask(() => {
    let root = roots.get(container);
    if (!root) {
      root = createRoot(container);
      roots.set(container, root);
    }
    root.render(createElement(StrictMode, null, node));
  });

  return container;
}

/* ----------------------------------------------------------------- schema */

const signUpSchema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    email: z
      .string()
      .min(1, 'Enter your email address')
      .email('Enter an email address in the format name@example.com'),
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .regex(/[0-9]/, 'Include at least one number'),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine(values => values.password === values.confirm, {
    message: 'Both passwords must match',
    path: ['confirm'],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

function SignUpFields() {
  const { control } = useFormContext<SignUpValues>();
  return (
    <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
      <FormTextField control={control} name="name" label="Full name" autocomplete="name" required />
      <FormTextField
        control={control}
        name="email"
        label="Email address"
        type="email"
        autocomplete="email"
        hint="We'll only use this to confirm your account."
        required
      />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        hint="At least 12 characters, including a number."
        required
      />
      <FormTextField
        control={control}
        name="confirm"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        required
      />
      <div>
        <mrd-button type="submit">Create account</mrd-button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- meta */

const meta: Meta = {
  title: 'Patterns/Forms with React Hook Form',
  parameters: {
    docs: {
      description: {
        component: [
          'Custom elements and React Hook Form do not fit together out of the box,',
          'and the ways they fail are quiet. `@meridian/react` closes three gaps:',
          '',
          '1. **Events.** The field emits `mrdInput`, a `CustomEvent`. React’s',
          "   synthetic event system never sees it, so `{...register('email')}`",
          '   silently captures nothing and the form submits empty strings.',
          '2. **Properties, not attributes.** `value` and `error` are properties.',
          '   Set as attributes, `undefined` stringifies to the literal',
          '   `"undefined"` — a user sees the word under a valid field.',
          '3. **Focus.** `shouldFocusError` calls `.focus()` on the ref. The real',
          '   `<input>` is inside a shadow root, so the call lands on the host and',
          '   nothing happens. We register the element’s `setFocus()` method as',
          '   the field ref instead.',
          '',
          'The adapter is roughly sixty lines. Every team integrating the design',
          'system would otherwise write those sixty lines, differently.',
        ].join('\n'),
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/* ---------------------------------------------------------------- stories */

export const SignUp: Story = {
  render: () =>
    mountReact(
      <MeridianForm
        schema={signUpSchema}
        onSubmit={values => {
          // eslint-disable-next-line no-console
          console.log('submitted', values);
        }}
        defaultValues={{ name: '', email: '', password: '', confirm: '' }}
      >
        <SignUpFields />
      </MeridianForm>,
    ),
  parameters: {
    docs: {
      description: {
        story: [
          'Submit the empty form. You get an error summary at the top listing every',
          'problem, focus moves to it, and each entry links to its field. Fix one',
          'field and focus stays where you put it — the summary is focused once per',
          'failed submit, not on every render.',
        ].join(' '),
      },
    },
  },
};

/** A schema-level error attached to a specific field via `path`. */
export const CrossFieldValidation: Story = {
  render: () =>
    mountReact(
      <MeridianForm
        schema={signUpSchema}
        onSubmit={() => undefined}
        defaultValues={{
          name: 'Arsim Sejdiu',
          email: 'arsim@example.com',
          password: 'correct-horse-1',
          confirm: 'correct-horse-2',
        }}
      >
        <SignUpFields />
      </MeridianForm>,
    ),
  parameters: {
    docs: {
      description: {
        story: [
          'Zod’s `.refine()` with an explicit `path` puts the "passwords must',
          'match" error on the confirmation field rather than on the form root.',
          'A form-level error has nowhere to be announced and nothing to focus,',
          'so it is invisible to a screen-reader user.',
        ].join(' '),
      },
    },
  },
};

/* ------------------------------------------------------------ field array */

const teamSchema = z.object({
  members: z
    .array(
      z.object({
        email: z.string().min(1, 'Enter an email address').email('Enter a valid email address'),
      }),
    )
    .min(1, 'Invite at least one person'),
});
type TeamValues = z.infer<typeof teamSchema>;

function MemberRows({ control }: { control: Control<TeamValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  return (
    <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
      {fields.map((field, index) => (
        <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <FormTextField
              control={control}
              name={`members.${index}.email`}
              label={`Member ${index + 1} email`}
              type="email"
            />
          </div>
          <mrd-button
            variant="ghost"
            label={`Remove member ${index + 1}`}
            onClick={() => remove(index)}
          >
            <span slot="start" aria-hidden="true">
              ✕
            </span>
          </mrd-button>
        </div>
      ))}
      <div>
        <mrd-button variant="secondary" onClick={() => append({ email: '' })}>
          Add another
        </mrd-button>
      </div>
    </div>
  );
}

function TeamFields() {
  const { control } = useFormContext<TeamValues>();
  return (
    <>
      <MemberRows control={control} />
      <div style={{ marginTop: '1rem' }}>
        <mrd-button type="submit">Send invitations</mrd-button>
      </div>
    </>
  );
}

export const FieldArray: Story = {
  render: () =>
    mountReact(
      <MeridianForm
        schema={teamSchema}
        onSubmit={() => undefined}
        defaultValues={{ members: [{ email: '' }, { email: '' }] }}
      >
        <TeamFields />
      </MeridianForm>,
    ),
  parameters: {
    docs: {
      description: {
        story: [
          'The error summary walks nested errors by path, so `members.1.email`',
          'appears as its own entry and its link focuses that row — not the',
          'unhelpful "members is invalid" that a shallow implementation produces.',
          '',
          'Note the remove buttons: each has a unique accessible name. A column of',
          'buttons all called "Remove" is technically labelled and practically',
          'useless when a screen reader lists them.',
        ].join('\n'),
      },
    },
  },
};

/* ----------------------------------------------------------- async submit */

function AsyncDemo() {
  const [state, setState] = useState<'idle' | 'sent'>('idle');

  if (state === 'sent') {
    return (
      <mrd-banner tone="success" heading="Account created" live>
        Check your inbox for the confirmation link.
      </mrd-banner>
    );
  }

  return (
    <MeridianForm
      schema={signUpSchema}
      onSubmit={async () => {
        await new Promise(resolve => setTimeout(resolve, 900));
        setState('sent');
      }}
      defaultValues={{ name: '', email: '', password: '', confirm: '' }}
    >
      <SignUpFields />
    </MeridianForm>
  );
}

export const AsyncSubmit: Story = {
  render: () => mountReact(<AsyncDemo />),
  parameters: {
    docs: {
      description: {
        story: [
          'While the submit handler is pending the form sets `aria-busy`. On',
          'success the form is replaced by a `live` success banner using',
          '`role="status"` — polite, so it does not cut across whatever the user',
          'is currently hearing, but still announced rather than merely drawn.',
        ].join(' '),
      },
    },
  },
};

/* ----------------------------------------------------------- interaction */

export const SummaryAppearsAndFocuses: Story = {
  render: () =>
    mountReact(
      <MeridianForm
        schema={signUpSchema}
        onSubmit={() => undefined}
        defaultValues={{ name: '', email: '', password: '', confirm: '' }}
      >
        <SignUpFields />
      </MeridianForm>,
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => expect(canvas.getByText('Create account')).toBeInTheDocument());
    await userEvent.click(canvas.getByText('Create account'));

    const summary = await waitFor(() => {
      const el = canvasElement.querySelector('mrd-banner[tone="danger"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(summary.querySelectorAll('li').length).toBe(4);
  },
};
