import { type ReactElement, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { MeridianForm, FormTextField } from '@meridian/react';
import {
  addressSchema,
  contactSchema,
  paymentSchema,
  emptyCheckout,
  type CheckoutValues,
} from './schema';

type StepId = 'contact' | 'address' | 'payment';

const STEPS = [
  { id: 'contact', title: 'Your details' },
  { id: 'address', title: 'Delivery address' },
  { id: 'payment', title: 'Payment' },
] as const satisfies ReadonlyArray<{ id: StepId; title: string }>;

// Destructuring a const tuple gives a defined element, which is what lets the
// bounds fallback below typecheck under `noUncheckedIndexedAccess` without an
// assertion. A non-null assertion would compile too, and would be a lie.
const [FIRST_STEP] = STEPS;

/* ------------------------------------------------------------------ steps */

function ContactFields(): ReactElement {
  const { control } = useFormContext<CheckoutValues>();
  return (
    <div className="stack">
      <FormTextField
        control={control}
        name="fullName"
        label="Full name"
        autocomplete="name"
        required
      />
      <FormTextField
        control={control}
        name="email"
        label="Email address"
        type="email"
        autocomplete="email"
        hint="Your receipt and delivery updates go here."
        required
      />
      <FormTextField
        control={control}
        name="phone"
        label="Phone number"
        type="tel"
        autocomplete="tel"
        hint="Optional. Only used if the courier cannot find the address."
      />
    </div>
  );
}

function AddressFields(): ReactElement {
  const { control } = useFormContext<CheckoutValues>();
  return (
    <div className="stack">
      <FormTextField
        control={control}
        name="street"
        label="Street and number"
        autocomplete="street-address"
        required
      />
      <div className="row">
        <FormTextField
          control={control}
          name="postcode"
          label="Postcode"
          autocomplete="postal-code"
          required
        />
        <FormTextField
          control={control}
          name="city"
          label="Town or city"
          autocomplete="address-level2"
          required
        />
        <FormTextField
          control={control}
          name="canton"
          label="Canton"
          hint="Two letters"
          autocomplete="address-level1"
          required
        />
      </div>
    </div>
  );
}

function PaymentFields(): ReactElement {
  const { control } = useFormContext<CheckoutValues>();
  return (
    <div className="stack">
      <mrd-banner tone="info" heading="Card details are entered on the next screen">
        They are collected by our payment provider directly, so they never pass through this page.
      </mrd-banner>
      <FormTextField
        control={control}
        name="cardholder"
        label="Cardholder name"
        autocomplete="cc-name"
        hint="Exactly as printed on the card."
        required
      />
      <FormTextField
        control={control}
        name="reference"
        label="Your reference"
        hint="Optional. Appears on your invoice."
      />
    </div>
  );
}

/* --------------------------------------------------------------- progress */

function Progress({ current }: { current: number }): ReactElement {
  return (
    <nav aria-label="Checkout progress">
      <ol className="progress">
        {STEPS.map((step, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo';
          return (
            <li key={step.id} className={`progress__item progress__item--${state}`}>
              {/*
                aria-current marks the step, and the visually hidden text carries
                the status. A coloured dot alone would be colour as the sole
                means of conveying information — WCAG 1.4.1.
              */}
              <span aria-current={state === 'current' ? 'step' : undefined}>
                {step.title}
                {state === 'done' && <span className="visually-hidden"> — completed</span>}
                {state === 'todo' && <span className="visually-hidden"> — not started</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- summary */

function Receipt({ values }: { values: CheckoutValues }): ReactElement {
  return (
    <>
      <mrd-banner tone="success" heading="Order confirmed" live>
        We&rsquo;ve emailed a confirmation to {values.email}.
      </mrd-banner>

      <h2>Delivering to</h2>
      <address>
        {values.fullName}
        <br />
        {values.street}
        <br />
        {values.postcode} {values.city} {values.canton}
      </address>
    </>
  );
}

/* ----------------------------------------------------------------- shell */

export function Checkout(): ReactElement {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<CheckoutValues>(emptyCheckout);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // stepIndex only ever comes from STEPS' own bounds, but the compiler cannot
  // know that — so fall back rather than assert.
  const step = STEPS[stepIndex] ?? FIRST_STEP;
  const schema =
    step.id === 'contact' ? contactSchema : step.id === 'address' ? addressSchema : paymentSchema;

  /**
   * Moving between steps is a view change without a navigation, so nothing
   * announces it by default. Focusing the new step's heading is what tells a
   * screen-reader user where they now are — the same job the browser does for
   * a real page load.
   */
  const goTo = (index: number) => {
    setStepIndex(index);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (done) return <Receipt values={values} />;

  return (
    <>
      <Progress current={stepIndex} />

      <h2 ref={headingRef} tabIndex={-1} className="step-heading">
        {step.title}
        <span className="step-heading__count">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
      </h2>

      {/*
        `key` remounts the form per step, so each step gets its own RHF instance
        with its own schema and its own submitCount. Sharing one instance across
        steps means step 2's untouched fields are already "invalid" while the
        user is still on step 1.
      */}
      <MeridianForm
        key={step.id}
        schema={schema as never}
        defaultValues={values as never}
        onSubmit={async stepValues => {
          const merged = { ...values, ...(stepValues as Partial<CheckoutValues>) };
          setValues(merged);

          if (stepIndex < STEPS.length - 1) {
            goTo(stepIndex + 1);
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 800));
          setDone(true);
        }}
      >
        {step.id === 'contact' && <ContactFields />}
        {step.id === 'address' && <AddressFields />}
        {step.id === 'payment' && <PaymentFields />}

        <div className="actions">
          {stepIndex > 0 && (
            <mrd-button
              variant="ghost"
              onClick={() => {
                goTo(stepIndex - 1);
              }}
            >
              Back
            </mrd-button>
          )}
          <mrd-button type="submit">
            {stepIndex === STEPS.length - 1 ? 'Place order' : 'Continue'}
          </mrd-button>
        </div>
      </MeridianForm>
    </>
  );
}
