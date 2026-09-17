# Example — multi-step checkout in React

A worked integration, not a showcase. It exists to answer the question that a
component gallery never answers: _what does this look like in a real form?_

```bash
pnpm install
pnpm build                                     # tokens + components first
pnpm --filter @meridian/example-react-checkout dev
```

## What it demonstrates

**A schema per step, composed into one payload.** `checkoutSchema` is the merge
of three step schemas. Each step validates only its own fields, so step 2's
untouched inputs are not "required and missing" while the user is still on step
1 — and the submit handler's argument type still comes from the same source as
the validation rather than being declared a second time.

**A form instance per step.** The `<MeridianForm key={step.id}>` remount is
deliberate. Sharing one React Hook Form instance across steps means sharing one
`submitCount` and one error set, which is how multi-step forms end up showing
the error summary for a step the user has not reached.

**Focus management between steps.** Changing step is a view change without a
navigation, so nothing announces it. The step heading is `tabIndex={-1}` and
receives focus on each transition — the job the browser does for you on a real
page load, and the single most common omission in single-page checkouts.

**Progress that survives greyscale.** The completed step is marked with a tick
and a visually hidden "— completed", not with a green dot. `aria-current="step"`
marks the current one.

**Errors that lead somewhere.** Submit an empty step. The summary appears at the
top, takes focus once, and each entry focuses its field — through the shadow
boundary, via the component's `setFocus()` method.

**No card number in form state.** The payment step collects a cardholder name
and a reference. Card details belong in the payment provider's hosted fields.
Copying them into React state to "validate the format" puts them in memory,
in any error report, and in the React DevTools tree.

**A theme switch with three states.** `system` is the default and stays
subscribed to the OS preference; `useTheme` resolves it through
`useSyncExternalStore`, so changing the OS theme repaints without a reload.

## What is worth reading

| File               | Why                                                        |
| ------------------ | ---------------------------------------------------------- |
| `src/schema.ts`    | Zod schemas, composed; note what is deliberately absent    |
| `src/Checkout.tsx` | Step machine, focus management, the `key` remount          |
| `src/app.css`      | Not one hex value and not one hard-coded size — all tokens |

That last one is the point of the whole exercise. The dark theme in this
application costs nothing to maintain because there is nothing in the
application to re-theme.
