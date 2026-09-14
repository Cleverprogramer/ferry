---
'ferry': minor
---

clear(options?) now accepts a ReadOptions object with a signal, matching the other write APIs: pre-aborted signals reject before touching the clipboard, and the native write races the signal mid-flight.
