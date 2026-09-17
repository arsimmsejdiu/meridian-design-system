import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { useFormContext } from 'react-hook-form';
import { MeridianForm } from './MeridianForm';
import { FormTextField } from './FormTextField';
import type { MrdTextFieldElement } from '../types';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
  name: z.string().min(2, 'Enter your name'),
});
type Values = z.infer<typeof schema>;

function Fields() {
  const { control } = useFormContext<Values>();
  return (
    <>
      <FormTextField control={control} name="email" label="Email" type="email" />
      <FormTextField control={control} name="name" label="Name" />
      <button type="submit">Submit</button>
    </>
  );
}

const setup = (onSubmit = vi.fn()) => {
  render(
    <MeridianForm schema={schema} onSubmit={onSubmit} defaultValues={{ email: '', name: '' }}>
      <Fields />
    </MeridianForm>,
  );
  return { onSubmit };
};

const field = (label: string) =>
  document.querySelector<MrdTextFieldElement>(`mrd-text-field[label="${label}"]`)!;

describe('FormTextField + MeridianForm', () => {
  it('renders one custom element per field with its label', () => {
    setup();
    expect(field('Email')).toBeInTheDocument();
    expect(field('Name')).toBeInTheDocument();
  });

  it('pushes validation errors onto the element as a property, not an attribute', async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(field('Email').error).toBe('Enter your email address');
    });
    // Property, not attribute — an attribute would stringify undefined.
    expect(field('Email').getAttribute('error')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('feeds mrdInput events back into the form state', async () => {
    const { onSubmit } = setup();

    field('Email').dispatchEvent(
      new CustomEvent('mrdInput', { detail: { value: 'arsim@example.com' } }),
    );
    field('Name').dispatchEvent(new CustomEvent('mrdInput', { detail: { value: 'Arsim' } }));

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({ email: 'arsim@example.com', name: 'Arsim' });
  });

  it('clears the error once the value becomes valid', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(field('Email').error).toBeTruthy());

    field('Email').dispatchEvent(
      new CustomEvent('mrdInput', { detail: { value: 'arsim@example.com' } }),
    );

    await waitFor(() => expect(field('Email').error).toBeUndefined());
  });

  it('shows an error summary listing every problem after a failed submit', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const summary = await screen.findByRole('alert');
    expect(summary).toHaveAttribute('heading', 'There is a problem');
    expect(summary.querySelectorAll('li')).toHaveLength(2);
    expect(summary.textContent).toContain('Enter your email address');
    expect(summary.textContent).toContain('Enter your name');
  });

  it('does not show the summary before the first submit', () => {
    setup();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
