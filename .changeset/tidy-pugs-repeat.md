---
'@meridian/tokens': minor
'@meridian/components': minor
'@meridian/react': minor
---

Split `theme.border.default` into `default` (dividers, decoration) and
`control` (the visible boundary of a form control).

The contrast audit found `border.default` at **1.78:1** against the light
canvas, where WCAG 2.2 SC 1.4.11 requires 3:1 for the boundary of a UI
component. One token was doing two jobs with two different requirements: a
divider between paragraphs carries no information and is exempt, while the
border of a text field is the only thing telling a low-vision user where the
input begins.

`mrd-button` and `mrd-text-field` now reference `--mrd-theme-border-control`.
Consumers styling their own inputs against Meridian tokens should do the same;
`--mrd-theme-border-default` still exists and is unchanged.

Also in this release, all found by getting the build to run for the first time:

- `mrd-text-field` threw during `connectedCallback` wherever `attachInternals()`
  exists but returns an object without `setFormValue` — Safari 16.4 among them.
  Form association is progressive enhancement, so the detection is now on the
  methods rather than on the factory, and the field degrades to "renders,
  validates and announces, but does not submit with a native form".
- The `dist-custom-elements` output now uses `single-export-module`, because the
  generated React and Angular bindings import each component class by name and
  `auto-define-custom-elements` does not export them.
- `dist-hydrate-script` is built, so consumers doing their own SSR have what they
  need. The React target's server components stay off: they only typecheck
  against React 19.
