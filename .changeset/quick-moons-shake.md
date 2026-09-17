---
'@meridian/react': minor
---

`MeridianForm`: focus the error summary once per failed submit rather than on
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
