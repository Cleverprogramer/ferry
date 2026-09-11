---
'ferry': minor
---

readText, readImage, and readFiles now race the native clipboard read against the caller's AbortSignal, so reads reject the moment the signal fires instead of stalling until the native call settles. FerryError rejections from the read path are no longer masked as permission failures.
