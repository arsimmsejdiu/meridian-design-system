import { z } from 'zod';

/**
 * One schema per step, composed into the whole.
 *
 * Keeping the steps separate lets us validate step 1 without step 2's fields
 * being "required and missing", while `checkoutSchema` still describes the
 * complete payload the API receives — so the type the submit handler gets is
 * derived from the same source as the validation, not declared twice.
 */

/** Swiss postcodes are four digits, 1000–9999. */
const swissPostcode = z
  .string()
  .regex(/^[1-9]\d{3}$/, 'Enter a four-digit Swiss postcode, for example 8005');

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address')
    .email('Enter an email address in the format name@example.com'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{9,}$/, 'Enter a phone number, including the country code')
    .optional()
    .or(z.literal('')),
});

export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Enter your street and number'),
  postcode: swissPostcode,
  city: z.string().trim().min(1, 'Enter your town or city'),
  canton: z
    .string()
    .trim()
    .length(2, 'Enter the two-letter canton code, for example ZH')
    .transform(value => value.toUpperCase()),
});

export const paymentSchema = z.object({
  /**
   * Note what is *not* here: no card number, no CVC. Card details go straight
   * to the payment provider's hosted fields and never touch this form's state.
   * A design system should make the safe path the easy one.
   */
  cardholder: z.string().trim().min(2, "Enter the cardholder's name as printed"),
  reference: z
    .string()
    .trim()
    .max(35, 'Keep the reference under 35 characters')
    .optional()
    .or(z.literal('')),
});

export const checkoutSchema = contactSchema.merge(addressSchema).merge(paymentSchema);

export type ContactValues = z.infer<typeof contactSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;
export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const emptyCheckout: CheckoutValues = {
  fullName: '',
  email: '',
  phone: '',
  street: '',
  postcode: '',
  city: '',
  canton: '',
  cardholder: '',
  reference: '',
};
