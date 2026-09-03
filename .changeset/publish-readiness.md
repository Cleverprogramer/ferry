---
'ferry': patch
---

Harden packaging: intermediate declaration files (use-clipboard.d.ts, use-clipboard-vue.d.ts) no longer ship in the npm tarball; prepublishOnly now runs tests, build, size budget, and a tarball audit before any publish.
