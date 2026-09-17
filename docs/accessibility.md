# Accessibility

Meridian targets **WCAG 2.2 level AA**. This page records what that means
concretely, what is automated, and what still needs a human.

## Automated gates

| Gate           | What it checks                                                                     | Where                                      |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| Contrast audit | Every shipped foreground/background pair, both themes, against SC 1.4.3 and 1.4.11 | `packages/tokens/build/audit-contrast.mjs` |
| axe            | Every story against WCAG 2.0/2.1/2.2 A and AA, in Chromium                         | `apps/docs/.storybook/test-runner.ts`      |
| Keyboard       | Focus order, focus return, Escape, trapping                                        | `*.e2e.ts`                                 |

All three block the build. Rules are not disabled to make CI green; an
exception is documented on the story with a reason and an owner.

## Success criteria we handle explicitly

**1.4.1 Use of colour** — status is never carried by colour alone. Each banner
tone has a distinct icon shape as well as a distinct colour.

**1.4.3 / 1.4.11 Contrast** — enforced by the audit above. Disabled controls
are technically exempt; we keep them at 4.5:1 anyway, because "is this disabled
or did it not load" is a real question users ask.

**2.1.2 No keyboard trap** — the dialog traps focus deliberately while open and
releases it on close. Nothing else traps.

**2.4.11 Focus not obscured** — the focus ring is drawn with an offset and a
contrasting outer shadow, so it stays visible against any surface.

**2.5.8 Target size** — 44×44px minimum pointer target on every interactive
control, via an expanded hit area that does not change the visual size.

**3.3.1 Error identification / 3.3.3 Error suggestion** — errors are announced
through a live region, associated with their field via `aria-describedby`, and
summarised in a focusable list on submit. Messages say what to do ("Enter a
valid email address"), not what happened ("Invalid input").

**Reduced motion** — every transition sits inside `@media (prefers-reduced-motion: no-preference)`.

## What automation does not catch

Roughly 60% of real accessibility problems are invisible to axe: whether a
label is _meaningful_, whether focus order matches reading order, whether an
announcement is useful or merely present. New interactive patterns are tested
manually with VoiceOver and NVDA before release.

## Reporting

Accessibility bugs are treated as bugs, not enhancements, and are prioritised
above feature work. Open an issue with the `a11y` label, the assistive
technology and version, and what you expected to happen.
