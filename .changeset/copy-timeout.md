---
'ferry': minor
---

Add a timeout option to copyToClipboard: an overall deadline in ms across all retry attempts that rejects with an ABORTED FerryError when exceeded. Aborts now race in-flight writes and backoff waits, so a hanging clipboard can no longer stall a copy forever. Size budgets moved to the 2.8 kB tier.
