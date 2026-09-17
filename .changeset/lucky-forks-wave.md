---
'meridian-design-system': patch
---

Unbreak the Release workflow.

Three problems, all of which only surface on CI:

- `@changesets/cli` v2 pulls in `@changesets/write`, which `require()`s
  `human-id`. `human-id@4.2.1` went ESM-only, so `changeset version` died with
  `ERR_REQUIRE_ESM` before doing anything. Upgraded to v3.
- `.changeset/config.json` names the `@changesets/changelog-github` formatter,
  which was never installed. Now a devDependency.
- The workflow had a `publish:` step with no npm token behind it, so Release
  would have failed on every run for want of a credential that does not exist.
  These packages are not on npm; the workflow now versions and opens the PR, and
  publishing is one line away when there is somewhere to publish to.
