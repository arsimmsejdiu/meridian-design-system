# 1. Web Components as the distribution format

- **Status:** Accepted
- **Date:** 2026-02-10
- **Deciders:** Design System team

## Context

The organisation runs Angular, React and a long tail of server-rendered pages,
and has done for a decade. Any library we ship will outlive at least one of
those frameworks. We need one implementation of a button — not three that drift.

Three options were considered:

1. **A React library, with wrappers for the rest.** Fastest for the largest
   team. Everyone else inherits React's runtime and its release cadence.
2. **Three parallel implementations.** Each idiomatic. Guaranteed to diverge —
   the third implementation of a date picker is where design systems die.
3. **Web Components, with generated framework wrappers.** One implementation.
   The contract is the DOM.

## Decision

Author components in **Stencil**, distribute as **custom elements**, and
generate the React and Angular wrappers from the same source.

Stencil rather than Lit because it generates the framework wrappers, the
`custom-elements.json` manifest and the docs from one compile step, and because
its lazy-loading output means a page pays only for the components it uses.

## Consequences

**Good**

- One component, one behaviour, one accessibility audit.
- Teams adopt at their own pace: a custom element works in a Twig template and
  in a React app without a build step in between.
- The contract is attributes, slots and events, which is documented by the
  platform and survives framework churn.

**Bad, and accepted**

- SSR is harder. Declarative Shadow DOM and Stencil's hydrate build cover it,
  but it is real work rather than a default.
- Form participation needs `ElementInternals`. We use it; older browsers lose
  native submission and need an explicit value binding.
- React 18 does not pass properties to custom elements, only attributes. This
  is why `@meridian/react` exists and why its adapters set properties
  imperatively. React 19 fixes it; the adapters stay until we drop 18.
- Developer tooling is weaker than React's. Storybook and the custom-elements
  manifest mitigate it; it remains a genuine cost.

## Revisit when

React 19 is the floor across the estate, or if the wrapper-maintenance burden
exceeds the cost of a second implementation.
