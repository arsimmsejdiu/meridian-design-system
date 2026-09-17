---
'@meridian/components': patch
---

Fix focus escaping `mrd-dialog` when its content is slotted.

Two bugs, one cause — and the second only appeared once the first was fixed.

`getFocusableElements` descended into shadow roots but never followed `<slot>`
elements. `mrd-dialog` renders `<slot name="footer">` inside its shadow root,
so every button a consumer passes is a child of the _host_, in the light DOM.
The walk never reached them. It now follows slots via `assignedElements()` and
returns nodes in composed-tree order, which is the order a user tabs through.

The focus trap also now runs even when `showModal()` succeeded. That looks
redundant and is not: a modal dialog in the top layer contains Tab to its own
DOM subtree, and slotted content is not in it. Tab walked past the footer
buttons and out to `<body>` — from inside a dialog that reports `:modal`.

Caught by the e2e suite. The test that was supposed to catch it was asserting
`closest('mrd-dialog') || getRootNode() instanceof ShadowRoot`, which is true of
almost any element on the page; it has been replaced with a containment walk
that crosses shadow boundaries properly.
