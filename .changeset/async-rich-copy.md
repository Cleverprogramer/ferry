---
'ferry': minor
---

Rich copies (options.html or the boolean sugar) now write both slots asynchronously via ClipboardItem when the browser supports it, instead of always using the deprecated execCommand path. execCommand remains the fallback for older engines and prefer: 'fallback'.
