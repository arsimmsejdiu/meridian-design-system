# Meridian Design System

Accessible, framework-agnostic UI components built on Web Components, with
generated React and Angular bindings.

[![CI](https://github.com/arsimmsejdiu/meridian-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/arsimmsejdiu/meridian-design-system/actions/workflows/ci.yml)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-1f4aae)](./docs/accessibility.md)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

---

## Why this exists

Most organisations run more than one frontend framework and will run a
different set in five years. Meridian implements each component **once**, as a
custom element, and generates the framework bindings from that single source —
so a button behaves identically in an Angular app, a React app and a
server-rendered template, and is audited for accessibility once rather than
three times.

The reasoning behind each major choice is recorded in [`docs/adr/`](./docs/adr).

## What's in the box

| Package                                                | Purpose                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [`@meridian/tokens`](./packages/tokens)                | Design tokens — one JSON source compiled to CSS custom properties, Sass, typed TypeScript and a flat JSON map for design tools |
| [`@meridian/components`](./packages/components)        | The components themselves — Stencil, TypeScript, Sass, Shadow DOM                                                              |
| [`@meridian/react`](./packages/react)                  | React bindings, plus React Hook Form adapters and a Zod-validated form wrapper                                                 |
| [`@meridian/angular`](./packages/angular)              | Generated Angular directives                                                                                                   |
| [`apps/docs`](./apps/docs)                             | Storybook — documentation, interaction tests and the axe test surface                                                          |
| [`examples/react-checkout`](./examples/react-checkout) | A worked multi-step checkout: schema per step, focus management, no hard-coded colours                                         |

## Quick start

```bash
pnpm install
pnpm build          # tokens → components → framework bindings
pnpm storybook      # docs at http://localhost:6006
```

### Plain HTML

```html
<link rel="stylesheet" href="node_modules/@meridian/tokens/dist/tokens.css" />
<script type="module" src="node_modules/@meridian/components/loader/index.js"></script>

<mrd-button variant="primary">Save changes</mrd-button>
```

### React, with React Hook Form and Zod

```tsx
import { z } from 'zod';
import { useFormContext } from 'react-hook-form';
import { MeridianForm, FormTextField } from '@meridian/react';

// Register the elements once, at your entry point. `@meridian/react` does not
// do it for you — see ADR 0005 for why that is deliberate.
import '@meridian/tokens/css';
import '@meridian/components';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
  name: z.string().min(2, 'Enter your name'),
});

function Fields() {
  const { control } = useFormContext<z.infer<typeof schema>>();
  return (
    <>
      <FormTextField control={control} name="email" label="Email" type="email" />
      <FormTextField control={control} name="name" label="Name" />
      <mrd-button type="submit">Create account</mrd-button>
    </>
  );
}

export const SignUp = () => (
  <MeridianForm schema={schema} onSubmit={values => api.signUp(values)}>
    <Fields />
  </MeridianForm>
);
```

`MeridianForm` renders an **error summary** on a failed submit: one focusable
region listing every problem, each linking to its field. Without it, a screen
reader user has to walk the whole form again to find what went wrong.

Three things the adapter handles that a bare binding does not — custom events
React never sees, properties stringified into attributes, and error focus that
cannot cross the shadow boundary. All three fail _silently_;
[ADR 0005](./docs/adr/0005-react-hook-form-adapters-over-raw-bindings.md) has
the detail.

## Accessibility

Meridian targets **WCAG 2.2 level AA**, and enforces it in CI rather than in an
annual audit:

- **Contrast audit** — every foreground/background pair we ship is verified in
  both themes on every build. A regression fails the build.
- **axe on every story** — the Storybook test runner checks each story against
  WCAG 2.0/2.1/2.2 A and AA in a real browser.
- **Keyboard behaviour is tested, not assumed** — focus order, focus return
  after a dialog closes, Escape handling and focus trapping are assertions in
  the e2e suite.
- **44px pointer targets** (SC 2.5.8) even where the control is visually
  smaller, via an expanded hit area.
- **`prefers-reduced-motion`** honoured on every transition.
- **Forced-colours mode** handled per component, since our backgrounds are
  dropped there and borders have to carry the meaning.

Automation catches roughly 40% of real issues — the 40% that regress silently.
New interactive patterns are still tested manually with a screen reader before
release. See [`docs/accessibility.md`](./docs/accessibility.md).

The audit earned its place on its first run, failing `border.default` at
**1.78:1** against the light canvas — the border of every text input in the
system, against a 3:1 requirement. The fix was to notice that one token was
doing two jobs: a divider is exempt from SC 1.4.11, the boundary of a control is
not. Hence `theme.border.control`, and a line in the audit asserting it.

## Theming

Three token layers: **core** (the palette) → **semantic** (roles) →
**component**. Components may reference semantic tokens only, which is enforced
by Stylelint rather than by convention. Adding a theme means adding one
semantic file; no component changes.

```html
<html data-theme="dark"></html>
```

Omit the attribute to follow the operating system.

## Development

```bash
pnpm dev                                     # watch everything
pnpm example                                 # the React checkout example
pnpm --filter @meridian/components test      # unit tests
pnpm --filter @meridian/components test:e2e  # browser tests
pnpm --filter @meridian/react test           # adapter tests
pnpm --filter @meridian/docs test:a11y       # axe over every story
pnpm audit:contrast                          # WCAG contrast, both themes
pnpm stylelint                               # no literal colours in components
pnpm size                                    # bundle budget
```

Every change to a published package needs a changeset:

```bash
pnpm changeset
```

The changelog is written by whoever made the change, not reconstructed from
commit messages afterwards.

## Browser support

Chrome, Edge, Firefox and Safari, last two major versions. Custom elements,
Shadow DOM, `ElementInternals` and `<dialog>` are all baseline. Forms degrade
gracefully where `ElementInternals` is unavailable.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). The short version: a component is
not done until it has unit tests, a story, keyboard coverage, both themes, and
a line in the contrast audit if it introduces a colour pair.

## Licence

Apache-2.0
