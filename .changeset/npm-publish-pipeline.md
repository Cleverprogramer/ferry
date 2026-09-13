---
'ferry': patch
---

Add a publish pipeline: a workflow_dispatch Publish to npm action that re-runs every gate (tests, build, size budget, tarball audit), publishes with npm OIDC provenance, and publishes the matching draft GitHub release. package.json gains publishConfig (public access).
