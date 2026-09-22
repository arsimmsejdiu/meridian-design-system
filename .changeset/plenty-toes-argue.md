---
'@meridian/components': patch
'@meridian/react': patch
---

Fixes found by getting the Storybook accessibility suite to run for the first
time. It had never executed: the preview imported `@meridian/components` but
never called `defineCustomElements()`, so every `<mrd-*>` in every story was an
unknown element. Slotted text still rendered, so the canvas looked broadly
right and only `shadowRoot` being null gave it away.

With the elements actually upgrading, axe had something to inspect:

- **Escape did nothing on the fallback path.** `mrd-dialog` relied on the native
  `cancel` event, which only fires for a dialog in the top layer. Where
  `showModal()` is unavailable the dialog opened and could not be dismissed with
  the keyboard. There is now an explicit Escape listener; both routes converge on
  one idempotent handler, so the modal case closing twice is harmless.
- **Error-summary links failed WCAG 2.2 SC 2.5.8** (target size, serious). Links
  in prose are exempt from the 24×24 minimum; these are the primary controls of
  the summary and the fastest route to a broken field, so they are not. They are
  now blocks with vertical padding, giving the whole row as the target.
- **The summary sometimes took focus and sometimes did not.** `focus()` on a
  custom element that has not completed its first render is silently dropped.
  `MeridianForm` now focuses on the next frame, with one retry.
