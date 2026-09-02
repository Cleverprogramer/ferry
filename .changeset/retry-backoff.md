---
'ferry': minor
---

Add retries and retryDelay options to copyToClipboard for automatic recovery from transient clipboard failures (exponential backoff). ABORTED, UNSUPPORTED, and INVALID_PAYLOAD always fail fast. Also deduplicated the RichCopyOptions type declaration.
