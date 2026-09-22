---
'meridian-design-system': patch
---

Install Puppeteer's browser explicitly in the browser-tests job.

Puppeteer fetches its browser in a postinstall script, into `~/.cache/puppeteer`
— outside the pnpm store. `setup-node` caches the store, so on a cache hit the
postinstall does not re-run and the browser is never fetched. The e2e suite then
fails with "Browser was not found at the configured executablePath", which reads
like a broken test rather than a missing download.

The job now runs `puppeteer browsers install chrome-headless-shell` before the
build, which is cheap and does not depend on whether the cache happened to hit.
