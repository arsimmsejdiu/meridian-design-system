# Contributing

## Definition of done for a component

A component is not finished when it renders. It is finished when all of these
are true:

- [ ] **Keyboard** — operable with Tab, Enter, Space, Escape and arrow keys as
      the [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) pattern
      requires. Focus is visible at every step and never lost.
- [ ] **Screen reader** — tested with at least one of VoiceOver, NVDA or JAWS.
      The accessible name, role and state are all correct, and state changes
      are announced once, not on every render.
- [ ] **Both themes** — light and dark, checked visually, not assumed.
- [ ] **Contrast** — any new foreground/background pair added to
      `packages/tokens/build/audit-contrast.mjs`.
- [ ] **Reduced motion** — every transition wrapped in the `motion-safe` mixin.
- [ ] **Forced colours** — checked in Windows High Contrast; borders carry the
      meaning where backgrounds are dropped.
- [ ] **Unit tests** — behaviour, not implementation. Assert what a user or an
      assistive technology observes.
- [ ] **A story** — with controls, and prose explaining _when_ to use it and
      when not to.
- [ ] **A changeset** — `pnpm changeset`.

## Writing components

**Reference semantic tokens only.** `var(--mrd-theme-action-primary-default)`,
never `var(--mrd-color-palette-brand-600)` and never a literal colour.
Stylelint will reject the latter two.

**Use the platform before reaching for JavaScript.** `<dialog>` gives you the
top layer, the backdrop, inertness and Escape. `<button>` gives you keyboard
activation and the right role. Re-implementing these is how bugs get in.

**Events are named `mrdSomething`** and carry a `detail` object even when there
is one value, so the shape can grow without a breaking change.

**Public API is:** attributes, properties, slots, events, CSS custom properties
and `::part`. Everything else may change in a patch release. Adding a part is a
deliberate, versioned decision — see ADR 3.

## Naming

Semantic tokens describe **role**, never appearance. `action-primary`, not
`blue-button`. The moment a name describes a colour, dark mode makes it a lie.

## Review

Every PR needs one approval. Accessibility-affecting changes need an approval
from someone who has tested the change with a screen reader — not the author.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/). The type drives
nothing automatically; changesets do the versioning. It keeps history readable.

## Changesets and the root package

A changeset names the **published packages** a change affects —
`@meridian/tokens`, `@meridian/components`, `@meridian/react`,
`@meridian/angular`. Never the root `meridian-design-system`: it is
`private: true`, so changesets cannot version it, and `changeset version` fails
outright with _"Found changeset … for package … which is not in the workspace"_.

Changes to CI, lint config, the example app or the docs site do not need a
changeset at all. Nothing a consumer installs has changed, so there is nothing
to put in a changelog. Describe those in the commit message and move on.
