# @meridian/react

## 0.2.0

### Minor Changes

- [`fc377a3`](https://github.com/arsimmsejdiu/meridian-design-system/commit/fc377a3499ebd2dc783d8687617c14622a13567c) Thanks [@arsimmsejdiu](https://github.com/arsimmsejdiu)! - `MeridianForm`: focus the error summary once per failed submit rather than on
  every render while it is visible.

  The previous implementation focused from a ref callback, which React invokes on
  each render. After a failed submit, every keystroke in the first field dragged
  focus back to the summary — the form was unusable with a keyboard from the
  moment it first failed validation. Focus is now keyed on `submitCount` in an
  effect, so a second failed submit re-announces the summary and typing does not.

  Also in this release:

  - The summary walks nested errors by path, so `members.1.email` gets its own
    entry and its own focus target instead of the parent object reporting itself
    as invalid.
  - `errorSummary={false}` opts out for short forms.
  - `aria-busy` is set on the form while an async submit handler is pending.

  - `shouldFocusError` is turned off while the summary is rendered. Previously
    both competed for focus after a failed submit and RHF won, because it focuses
    after our effect — so the summary appeared, announced nothing, and the user
    landed in the first invalid field with no idea how many others there were.
    With the summary off, RHF's behaviour is restored.

- [`fc377a3`](https://github.com/arsimmsejdiu/meridian-design-system/commit/fc377a3499ebd2dc783d8687617c14622a13567c) Thanks [@arsimmsejdiu](https://github.com/arsimmsejdiu)! - Split `theme.border.default` into `default` (dividers, decoration) and
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

### Patch Changes

- [`fc377a3`](https://github.com/arsimmsejdiu/meridian-design-system/commit/fc377a3499ebd2dc783d8687617c14622a13567c) Thanks [@arsimmsejdiu](https://github.com/arsimmsejdiu)! - `useTheme`: read the system preference through `useSyncExternalStore` instead
  of calling `matchMedia` during render.

  Two bugs, one cause. Reading in render meant `resolved` was stale until
  something else re-rendered the component — so switching the OS to dark mode did
  nothing until the user interacted with the page. It also touched `window`
  during render, which throws under server rendering.

  The hook now also syncs across tabs via the `storage` event, and ignores a
  stored value that is not one of the three valid themes.

- [`17472a0`](https://github.com/arsimmsejdiu/meridian-design-system/commit/17472a01021d224de178d5544cf957d791d331e0) Thanks [@arsimmsejdiu](https://github.com/arsimmsejdiu)! - Fixes found by getting the Storybook accessibility suite to run for the first
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

- Updated dependencies [[`888ed26`](https://github.com/arsimmsejdiu/meridian-design-system/commit/888ed26a1914a159eb517f5dfda96c150ee09652), [`17472a0`](https://github.com/arsimmsejdiu/meridian-design-system/commit/17472a01021d224de178d5544cf957d791d331e0), [`fc377a3`](https://github.com/arsimmsejdiu/meridian-design-system/commit/fc377a3499ebd2dc783d8687617c14622a13567c)]:
  - @meridian/components@0.2.0
