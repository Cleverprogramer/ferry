# ferry

## 0.9.1

### Patch Changes

- [#117](https://github.com/Cleverprogramer/ferry/pull/117) [`d9ad8a8`](https://github.com/Cleverprogramer/ferry/commit/d9ad8a8f656b0ff09fd390150839959f042f507e) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Ship external sourcemaps for every dist bundle (ESM, CJS, and the CDN global) so stack traces from the published package map back to the source. Tarball audit updated to expect the .map files.

## 0.9.0

### Minor Changes

- [#115](https://github.com/Cleverprogramer/ferry/pull/115) [`46e8330`](https://github.com/Cleverprogramer/ferry/commit/46e833080618fa015b8af093841a7c0876723d50) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - clear(options?) now accepts a ReadOptions object with a signal, matching the other write APIs: pre-aborted signals reject before touching the clipboard, and the native write races the signal mid-flight.

## 0.8.1

### Patch Changes

- [#110](https://github.com/Cleverprogramer/ferry/pull/110) [`f1f5073`](https://github.com/Cleverprogramer/ferry/commit/f1f5073a11b765aa5857117d9f65bb48571e773a) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add a publish pipeline: a workflow_dispatch Publish to npm action that re-runs every gate (tests, build, size budget, tarball audit), publishes with npm OIDC provenance, and publishes the matching draft GitHub release. package.json gains publishConfig (public access).

## 0.8.0

### Minor Changes

- [#107](https://github.com/Cleverprogramer/ferry/pull/107) [`cf88282`](https://github.com/Cleverprogramer/ferry/commit/cf88282f2bd857970868582c840b2b7da2c678ed) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add readHtml(options?): read the clipboard's text/html slot (rich paste) via clipboard.read(), mirroring readText. Rejects UNSUPPORTED without ClipboardItem support, INVALID_PAYLOAD when no html slot is present, and races the caller's AbortSignal mid-flight.

## 0.7.0

### Minor Changes

- [#102](https://github.com/Cleverprogramer/ferry/pull/102) [`d5d14dc`](https://github.com/Cleverprogramer/ferry/commit/d5d14dc3f2718b937e55796d24672c5cc9f1ac32) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - readText, readImage, and readFiles now race the native clipboard read against the caller's AbortSignal, so reads reject the moment the signal fires instead of stalling until the native call settles. FerryError rejections from the read path are no longer masked as permission failures.

## 0.6.0

### Minor Changes

- [#95](https://github.com/Cleverprogramer/ferry/pull/95) [`17631b6`](https://github.com/Cleverprogramer/ferry/commit/17631b62145c92f987257883021faf723af7d09e) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Rich copies (options.html or the boolean sugar) now write both slots asynchronously via ClipboardItem when the browser supports it, instead of always using the deprecated execCommand path. execCommand remains the fallback for older engines and prefer: 'fallback'.

- [#96](https://github.com/Cleverprogramer/ferry/pull/96) [`8ecb4d9`](https://github.com/Cleverprogramer/ferry/commit/8ecb4d9c76598b98121f5de3d335e7cac58029fc) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add ferry/svelte: a useClipboard adapter built on plain svelte/store writables, compatible with Svelte 3, 4, and 5 (svelte is an optional peer dependency). Ships dist/svelte.js, dist/svelte.cjs, and declarations; included in the tarball audit and size budgets.

## 0.5.0

### Minor Changes

- [#93](https://github.com/Cleverprogramer/ferry/pull/93) [`76f3f01`](https://github.com/Cleverprogramer/ferry/commit/76f3f014d208cf7f13ab75ed98e97086cb441882) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add a timeout option to copyToClipboard: an overall deadline in ms across all retry attempts that rejects with an ABORTED FerryError when exceeded. Aborts now race in-flight writes and backoff waits, so a hanging clipboard can no longer stall a copy forever. Size budgets moved to the 2.8 kB tier.

## 0.4.1

### Patch Changes

- [#84](https://github.com/Cleverprogramer/ferry/pull/84) [`560980a`](https://github.com/Cleverprogramer/ferry/commit/560980a3cfc8c1d814f42ca004262114f728cf39) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Harden packaging: intermediate declaration files (use-clipboard.d.ts, use-clipboard-vue.d.ts) no longer ship in the npm tarball; prepublishOnly now runs tests, build, size budget, and a tarball audit before any publish.

## 0.4.0

### Minor Changes

- [#73](https://github.com/Cleverprogramer/ferry/pull/73) [`c37092e`](https://github.com/Cleverprogramer/ferry/commit/c37092e93381febc878c2207e00fe0e09d0970c0) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add getCapabilities() for granular, per-feature clipboard support detection (asyncWrite, asyncRead, asyncItems, execCommand, permissionsApi).

- [#75](https://github.com/Cleverprogramer/ferry/pull/75) [`ba1d778`](https://github.com/Cleverprogramer/ferry/commit/ba1d7788ec911ff38c8be882d79191262325b138) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add queryPermission(action) helper returning granted | denied | prompt | unsupported for clipboard read/write permissions.

- [#76](https://github.com/Cleverprogramer/ferry/pull/76) [`92dc1f9`](https://github.com/Cleverprogramer/ferry/commit/92dc1f99f292f0e029e28d90afa5f64d7fae092e) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add retries and retryDelay options to copyToClipboard for automatic recovery from transient clipboard failures (exponential backoff). ABORTED, UNSUPPORTED, and INVALID_PAYLOAD always fail fast. Also deduplicated the RichCopyOptions type declaration.

## 0.3.0

### Minor Changes

- [#52](https://github.com/Cleverprogramer/ferry/pull/52) [`fb52ad1`](https://github.com/Cleverprogramer/ferry/commit/fb52ad1395ad47f38ed9f96808e797d8108137dc) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add `useClipboard()` React hook via the new `ferry/react` subpath export. Wraps `copyToClipboard` with copied/error state and an optional auto-reset timeout. React >=17 is an optional peer dependency.
