---
'ferry': minor
---

Add readHtml(options?): read the clipboard's text/html slot (rich paste) via clipboard.read(), mirroring readText. Rejects UNSUPPORTED without ClipboardItem support, INVALID_PAYLOAD when no html slot is present, and races the caller's AbortSignal mid-flight.
