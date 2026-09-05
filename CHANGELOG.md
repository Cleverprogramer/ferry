# ferry

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
