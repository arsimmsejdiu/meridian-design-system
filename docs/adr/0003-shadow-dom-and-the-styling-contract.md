# 3. Shadow DOM, and what consumers may style

- **Status:** Accepted
- **Date:** 2026-03-05

## Context

Shadow DOM gives real encapsulation: the host page cannot reach in, and our
styles cannot leak out. In an estate with a decade of accumulated global CSS,
that is the difference between a component that behaves the same everywhere and
one that is subtly broken on the pages nobody tested.

The cost is that consumers cannot restyle internals, and they will want to.

## Decision

`shadow: true` on every component. The styling contract is explicit and narrow:

- **CSS custom properties** — the supported way to theme. They pierce the
  shadow boundary by design.
- **`::part()`** — exposed deliberately, one part per element a consumer has a
  legitimate reason to adjust. Parts are public API and follow semver.
- **Everything else is private** and may change in a patch release.

## Consequences

- Someone will ask to style an internal we did not expose. The answer is either
  a new part (considered, versioned) or a fix in the component itself. It is
  never `::ng-deep` or `!important`.
- Global resets do not apply inside the shadow root, so each component carries
  its own baseline. Slight duplication, in exchange for predictability.
- Forced-colours mode needs explicit handling per component, since our
  backgrounds are dropped. The `forced-colors-outline` mixin exists for this.
