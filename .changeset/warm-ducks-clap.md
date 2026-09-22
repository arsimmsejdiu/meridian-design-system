---
'meridian-design-system': patch
---

Fix the accessibility job's command line: the flag is `--testTimeout`, not
`--test-timeout`. Commander rejects the unknown option and exits 1 before a
single story loads, so the job failed while looking exactly like a test failure.
