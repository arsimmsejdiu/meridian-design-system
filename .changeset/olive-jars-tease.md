---
'@meridian/react': patch
---

`useTheme`: read the system preference through `useSyncExternalStore` instead
of calling `matchMedia` during render.

Two bugs, one cause. Reading in render meant `resolved` was stale until
something else re-rendered the component — so switching the OS to dark mode did
nothing until the user interacted with the page. It also touched `window`
during render, which throws under server rendering.

The hook now also syncs across tabs via the `storage` event, and ignores a
stored value that is not one of the three valid themes.
