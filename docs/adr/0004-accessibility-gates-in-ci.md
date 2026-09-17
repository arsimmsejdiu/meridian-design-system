# 4. Accessibility is a build gate, not a review step

- **Status:** Accepted
- **Date:** 2026-03-19

## Context

Accessibility work that happens in an annual audit gets fixed once and
regresses over the following year. The cost of a violation is lowest at the
moment it is written.

## Decision

Three automated gates, all blocking:

1. **Contrast audit** (`packages/tokens/build/audit-contrast.mjs`) — every
   foreground/background pair we ship is checked against WCAG 2.2 in both
   themes. Adding a component usually means adding a row.
2. **axe over every story** — the Storybook test runner checks each story
   against WCAG 2.0/2.1/2.2 A and AA in a real browser.
3. **Keyboard behaviour in e2e tests** — focus order, focus return, Escape,
   focus trapping. Assertions, not a checklist.

We do not disable rules to make the build pass. An exception is documented on
the story with a reason and an owner.

## Consequences

- Automation catches perhaps 40% of real issues. It catches the 40% that
  regress silently, which is the part humans are worst at.
- Manual testing with a screen reader is still required for new patterns, and
  is part of the definition of done for any component with interaction.
- The gates slow CI by roughly two minutes. That is the cheapest accessibility
  work available to us.
