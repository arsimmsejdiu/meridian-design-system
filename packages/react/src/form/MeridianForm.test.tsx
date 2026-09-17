import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { useFormContext } from 'react-hook-form';
import { MeridianForm } from './MeridianForm';
import { FormTextField } from './FormTextField';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
  address: z.object({
    city: z.string().min(1, 'Enter your city'),
  }),
});
type Values = z.infer<typeof schema>;

function Fields() {
  const { control } = useFormContext<Values>();
  return (
    <>
      <FormTextField control={control} name="email" label="Email" type="email" />
      <FormTextField control={control} name="address.city" label="City" />
      <button type="submit">Submit</button>
    </>
  );
}

const setup = (props: Partial<React.ComponentProps<typeof MeridianForm<Values>>> = {}) => {
  const onSubmit = vi.fn();
  render(
    <MeridianForm
      schema={schema}
      onSubmit={onSubmit}
      defaultValues={{ email: '', address: { city: '' } }}
      {...props}
    >
      <Fields />
    </MeridianForm>,
  );
  return {
    onSubmit,
    submit: () => userEvent.click(screen.getByRole('button', { name: 'Submit' })),
  };
};

describe('MeridianForm error summary', () => {
  it('lists nested field errors by path rather than reporting the object as invalid', async () => {
    const { submit } = setup();
    await submit();

    const summary = await screen.findByRole('alert');
    const links = summary.querySelectorAll('a');

    expect(links).toHaveLength(2);
    expect(links[0]!.textContent).toBe('Enter your email address');
    expect(links[1]!.textContent).toBe('Enter your city');
    expect(links[1]!.getAttribute('href')).toBe('#address.city');
  });

  it('focuses the summary once per failed submit, not on every render', async () => {
    const { submit } = setup();
    await submit();

    const summary = await screen.findByRole('alert');
    await waitFor(() => expect(document.activeElement).toBe(summary));

    // Simulate the user starting to fix the first field. Focus must stay where
    // the user put it — re-focusing the summary here would make the form
    // unusable, which is exactly what a naive ref callback does.
    const field = document.querySelector<HTMLElement>('mrd-text-field[label="Email"]')!;
    field.dispatchEvent(new CustomEvent('mrdInput', { detail: { value: 'a' } }));
    field.focus();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(field);
  });

  it('re-focuses the summary on a second failed submit', async () => {
    const { submit } = setup();
    await submit();

    const summary = await screen.findByRole('alert');
    (document.activeElement as HTMLElement | null)?.blur();

    await submit();
    await waitFor(() => expect(document.activeElement).toBe(summary));
  });

  it('marks the summary as a live region so it is announced when injected', async () => {
    const { submit } = setup();
    await submit();

    const summary = await screen.findByRole('alert');
    expect(summary.tagName.toLowerCase()).toBe('mrd-banner');
    expect(summary).toHaveAttribute('tone', 'danger');
    expect(summary).toHaveAttribute('tabindex', '-1');
  });

  it('can be turned off for short forms where inline errors suffice', async () => {
    const { submit } = setup({ errorSummary: false });
    await submit();

    await waitFor(() =>
      expect(
        document.querySelector<HTMLElement & { error?: string }>('mrd-text-field[label="Email"]')!
          .error,
      ).toBeTruthy(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("hands focus back to RHF's first-invalid-field behaviour when the summary is off", async () => {
    // Two things cannot both take focus. With no summary to focus, the first
    // invalid field should get it — otherwise turning the summary off would
    // leave a failed submit with no focus target at all.
    const { submit } = setup({ errorSummary: false });
    await submit();

    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector('mrd-text-field[label="Email"]')),
    );
  });

  it('calls onSubmit with parsed values once everything is valid', async () => {
    const { onSubmit, submit } = setup();

    document
      .querySelector('mrd-text-field[label="Email"]')!
      .dispatchEvent(new CustomEvent('mrdInput', { detail: { value: 'arsim@example.com' } }));
    document
      .querySelector('mrd-text-field[label="City"]')!
      .dispatchEvent(new CustomEvent('mrdInput', { detail: { value: 'Zug' } }));

    await submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({
      email: 'arsim@example.com',
      address: { city: 'Zug' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
