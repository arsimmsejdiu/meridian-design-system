# 2. Three-layer token architecture

- **Status:** Accepted
- **Date:** 2026-02-24

## Context

The first version of the palette exposed `--mrd-color-brand-600` directly to
components. Within six weeks a component hard-coded it for a hover state, a
second theme was requested, and the hover state was wrong in the new theme with
no way to fix it centrally.

## Decision

Three layers, with a rule about who may reference what:

| Layer         | Example                                 | May be referenced by |
| ------------- | --------------------------------------- | -------------------- |
| **Core**      | `--mrd-color-palette-brand-600`         | Semantic layer only  |
| **Semantic**  | `--mrd-theme-action-primary-hover`      | Components           |
| **Component** | `--mrd-component-button-padding-inline` | That component only  |

Components may reference **semantic tokens only**. This is enforced, not
merely documented: `.stylelintrc.json` rejects literal colour values in
component stylesheets, and the palette is not injected into component Sass.

## Consequences

- A new theme is a new semantic file. No component changes.
- Renaming a palette entry cannot break a component.
- The indirection costs something: a developer chasing a colour reads two files
  instead of one. The Storybook token page exists to make that cheap.
- Semantic names must describe _role_, never appearance. `action-primary`, not
  `blue-button`. Once a name describes a colour, dark mode makes it a lie.
