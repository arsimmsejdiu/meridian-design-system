# 5. React Hook Form adapters, not just generated bindings

- **Status:** Accepted
- **Date:** 2026-02-18
- **Deciders:** Design Systems
- **Supersedes:** —

## Context

`@stencil/react-output-target` generates a React proxy for every custom
element. That is enough to _render_ a component from React. It is not enough to
put one in a form.

React Hook Form is the default choice for forms in the React applications that
consume this system. Wiring it to a custom element fails in three places, and
every one of them fails **silently** — no exception, no console warning, just a
form that does the wrong thing.

### 1. Custom events are invisible to React

The field emits `mrdInput`, a `CustomEvent` dispatched from inside the shadow
root. React's synthetic event system knows about a fixed set of DOM events and
attaches its listeners at the root; `mrdInput` is not one of them.

```tsx
// Renders. Looks correct in review. Submits an empty string, always.
<mrd-text-field {...register('email')} />
```

`register` returns `onChange`, `onBlur`, `name` and `ref`. React turns
`onChange` into a listener for the native `change` event, which the host element
never fires. Nothing throws. The form submits `{ email: '' }`.

### 2. Properties are not attributes

`value` and `error` are properties on the element, typed `string` and
`string | undefined`. JSX in React 18 sets unknown props as **attributes**,
which stringifies:

```tsx
<mrd-text-field error={undefined} />
// → <mrd-text-field error="undefined">
// → the word "undefined" rendered in red under a valid field
```

### 3. `shouldFocusError` cannot reach the input

RHF's error focus calls `.focus()` on the registered ref. The registered ref is
the host element; the real `<input>` is inside its shadow root. `HTMLElement`
has a `focus()` method, so the call succeeds and focus goes nowhere useful. The
observable result is that submitting an invalid form moves focus to the host and
a screen reader announces nothing — a WCAG 3.3.1 failure that no automated tool
detects, because the markup is correct.

## Decision

Ship **`@meridian/react` as a first-class package**, containing:

- `FormTextField` — a `useController`-based adapter that binds `mrdInput` and
  `mrdBlur` imperatively, assigns `value`/`error` as properties, and registers
  `{ focus: () => el.setFocus() }` as the field ref so RHF's error focus reaches
  through the shadow boundary.
- `MeridianForm` — a Zod-resolved `<form>` that renders a focusable error
  summary after a failed submit.

The adapters are part of the design system, not of each application.

## Consequences

**Good**

- The three failure modes are fixed once, in sixty lines, and tested once. Every
  consuming team would otherwise write those sixty lines, differently, and two
  of the three bugs would ship because they produce no error.
- Error-summary behaviour — the highest-value accessibility pattern in any form —
  becomes the default rather than something each team remembers to build.
- The adapters are the natural place to enforce the accessible-name and
  focus-order rules that a bare binding cannot.

**Bad**

- A React-specific package to maintain, which cuts against the
  framework-agnostic premise in [ADR 0001](./0001-web-components-as-the-distribution-format.md).
  We accept the asymmetry: React is where the forms are. If Angular consumers
  reach the same volume, `@meridian/angular` gets the equivalent for Reactive
  Forms rather than the React package being generalised.
- `react-hook-form`, `zod` and `@hookform/resolvers` become **peer**
  dependencies. Bundling them would risk two copies of RHF and a context
  mismatch that presents as "useFormContext returned null".

**Neutral**

- The adapter is deliberately thin — `useController`, two `useEffect`s and a ref
  callback. It is not a form framework. Teams needing something else drop to the
  generated binding and wire it themselves.

## Alternatives considered

**Tell teams to use `Controller` directly.** This is what the adapter does
internally, and it is the honest baseline. Rejected because it leaves problems 2
and 3 unsolved: `Controller` still sets props as attributes and still hands RHF
a ref it cannot focus. Every team would rediscover both.

**Make the components React-aware** — emit React-compatible events, accept
attributes for everything. Rejected outright. It would put framework-specific
behaviour into the one layer whose entire purpose is to have none, and it would
make the Angular and plain-HTML consumers pay for it.

**Wait for React 19.** React 19 handles custom elements properly: it sets
properties when a property of that name exists and dispatches to
`addEventListener` for unknown `on*` props. That removes problems 1 and 2 —
but not problem 3, which is about shadow DOM, not React. And consumers will be
on React 18 for years. When the estate is entirely on 19, `FormTextField`
simplifies to focus management alone and the rest of the adapter is deleted.
That is a deletion we can look forward to, which is a reasonable sign the
abstraction is in the right place.
