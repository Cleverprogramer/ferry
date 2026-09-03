# ferry

## 0.4.0

### Minor Changes

- [#73](https://github.com/Cleverprogramer/ferry/pull/73) [`c37092e`](https://github.com/Cleverprogramer/ferry/commit/c37092e93381febc878c2207e00fe0e09d0970c0) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add getCapabilities() for granular, per-feature clipboard support detection (asyncWrite, asyncRead, asyncItems, execCommand, permissionsApi).

- [#75](https://github.com/Cleverprogramer/ferry/pull/75) [`ba1d778`](https://github.com/Cleverprogramer/ferry/commit/ba1d7788ec911ff38c8be882d79191262325b138) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add queryPermission(action) helper returning granted | denied | prompt | unsupported for clipboard read/write permissions.

- [#76](https://github.com/Cleverprogramer/ferry/pull/76) [`92dc1f9`](https://github.com/Cleverprogramer/ferry/commit/92dc1f99f292f0e029e28d90afa5f64d7fae092e) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add retries and retryDelay options to copyToClipboard for automatic recovery from transient clipboard failures (exponential backoff). ABORTED, UNSUPPORTED, and INVALID_PAYLOAD always fail fast. Also deduplicated the RichCopyOptions type declaration.

## 0.3.0

### Minor Changes

- [#52](https://github.com/Cleverprogramer/ferry/pull/52) [`fb52ad1`](https://github.com/Cleverprogramer/ferry/commit/fb52ad1395ad47f38ed9f96808e797d8108137dc) Thanks [@Cleverprogramer](https://github.com/Cleverprogramer)! - Add `useClipboard()` React hook via the new `ferry/react` subpath export. Wraps `copyToClipboard` with copied/error state and an optional auto-reset timeout. React >=17 is an optional peer dependency.
