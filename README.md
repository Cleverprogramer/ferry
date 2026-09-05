# ferry 🚢

[![CI](https://github.com/Cleverprogramer/ferry/actions/workflows/ci.yml/badge.svg)](https://github.com/Cleverprogramer/ferry/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-3fb950.svg)](LICENSE)
![Core bundle](https://img.shields.io/badge/core_gzipped-%3C2.8_kB-2f81f7)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-3fb950)
![Tests](https://img.shields.io/badge/tests-85_unit_+_14_e2e-8957e5)

`import { copyToClipboard } from 'ferry'`

A tiny zero-dependency browser utility that ferries **text, rich HTML, JSON, images, and files** onto — and off of — the clipboard.

- ✍️ **Rich copies** — write `text/html` and `text/plain` slots in one shot (async `ClipboardItem` where available, `execCommand` fallback everywhere else)
- 🛡️ **Typed errors** — every rejection is a `FerryError` with a stable `code`; branch on codes, never message strings
- 🔍 **Real feature detection** — `getCapabilities()` + `queryPermission()` instead of user-agent sniffing
- 🪝 **React, Vue, and Svelte hooks** — same contract in all three, each an optional peer dependency
- ⏱️ **Retries, backoff, and deadlines** — built for kiosks and POS terminals with flaky clipboard access
- 📦 **Dual ESM + CJS** with TypeScript declarations, plus a no-build CDN global

🎮 **[Try the live playground →](https://cleverprogramer.github.io/ferry/)**

## Contents

- [Browser support](#browser-support)
- [Install](#install)
- [Quick start](#quick-start)
- [API](#api)
- [Framework adapters](#framework-adapters)
- [CDN / script tag](#cdn--script-tag)
- [Error handling](#error-handling)
- [Contributing](#contributing)
- [Development](#development)

## Browser support

| API | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| `copyToClipboard` (async API) | ✅ 66+ | ✅ 79+ | ✅ 63+ | ✅ 13.1+ |
| `copyToClipboard` rich slots (async `ClipboardItem`) | ✅ 76+ | ✅ 79+ | ⚠️ via fallback | ✅ 13.1+ |
| `isSupported`, `clear`, `copyJson`, `copyElement` | ✅ | ✅ | ✅ | ✅ |
| `readText` | ✅ 66+ | ✅ 79+ | ✅ 125+ | ✅ 13.1+ |
| `copyImage` / `readImage` (ClipboardItem) | ✅ 76+ | ✅ 79+ | ⚠️ limited | ✅ 13.1+ |
| `readFiles` | ✅ 76+ | ✅ 79+ | ⚠️ limited | ⚠️ partial |
| `timeout` / `retries` options | ✅ | ✅ | ✅ | ✅ |

Every write falls back to the hidden-textarea `execCommand('copy')` path automatically where the async Clipboard API is unavailable, and rich copies fall back from `ClipboardItem` to `execCommand` when `ClipboardItem` is missing. Clipboard **read** APIs additionally require a secure context (HTTPS/localhost) and, in some browsers, explicit user permission.

## Install

npm registry publishing is imminent — until it lands, install straight from GitHub:

```bash
bun add github:Cleverprogramer/ferry
npm i github:Cleverprogramer/ferry
yarn add github:Cleverprogramer/ferry
```

## Quick start

```ts
import { copyToClipboard, readText } from 'ferry';

await copyToClipboard('hello!');
const pasted = await readText();
```

## API

### `copyToClipboard(content: string, options?: boolean | CopyOptions): Promise<void>`

Copies `content` as plain text. With `options = true` (the rich sugar), `content` is copied as **both** `text/html` and `text/plain`. Rejects with a `FerryError` when copying fails or no strategy is available.

**`CopyOptions`** — every field is optional:

| Option | Type | Default | What it does |
|---|---|---|---|
| `html` | `string` | — | Markup for the `text/html` slot; `text` fills the plain slot |
| `text` | `string` | `content` | Override the plain-text slot independently |
| `signal` | `AbortSignal` | — | Cancel the operation (rejects with `ABORTED`) |
| `prefer` | `'auto' \| 'async' \| 'fallback'` | `'auto'` | Force the async Clipboard API or the `execCommand` path |
| `retries` | `number` | `0` | Extra attempts after the first failure |
| `retryDelay` | `number` | `100` | Base backoff in ms; doubles each attempt |
| `timeout` | `number` | `0` | Overall deadline in ms across **all** attempts (rejects `ABORTED`) |

```ts
// Rich editors get markup; plain editors get clean text
await copyToClipboard('<b>bold</b>', { html: '<b>bold</b>', text: 'bold' });
```

Flaky clipboard access (kiosks, POS, webviews) — opt into retries with exponential backoff. `ABORTED`, `UNSUPPORTED`, and `INVALID_PAYLOAD` always fail fast:

```ts
await copyToClipboard(text, { retries: 3, retryDelay: 100 });
```

Wedged clipboards shouldn't hang your UI — put the whole operation under a deadline (`ABORTED` rejects with `copy timed out after Nms`):

```ts
await copyToClipboard(text, { timeout: 3000, retries: 2, retryDelay: 100 });
```

Force a strategy when you need determinism (tests, CSP-restricted pages):

```ts
await copyToClipboard('text', { prefer: 'fallback' });
```

### `copyJson(value: unknown, pretty?: boolean): Promise<void>`

Serializes a value to JSON and copies it. `pretty = true` uses 2-space indentation. Rejects with `INVALID_PAYLOAD` for values JSON cannot represent.

```ts
await copyJson({ hello: 'world' }, true);
```

### `copyElement(element: Element): Promise<void>`

Copies a DOM element's markup (`outerHTML`) as rich HTML content. Rejects with `INVALID_PAYLOAD` for non-elements.

```ts
const chart = document.querySelector('#chart');
if (chart) await copyElement(chart);
```

### `copyImage(source: Blob | string, options?: { type?: string; signal?: AbortSignal }): Promise<void>`

Copies an image to the clipboard. Pass a `Blob` directly, or a URL string which ferry fetches and converts for you. Rejects when image copying is unsupported, the payload is not an image, or permission is denied.

```ts
await copyImage(canvasOrFileBlob);
await copyImage('https://example.com/cat.png');
```

Safari quirk: `ClipboardItem` must be constructed during the user gesture. Pass an async factory plus an explicit `type` and ferry hands the promise straight through:

```ts
await copyImage(() => renderCanvasToBlob(), { type: 'image/png' });
```

### `readText(options?: ReadOptions): Promise<string>`

Reads the clipboard's current text content. Rejects when reading is unsupported or permission is denied.

```ts
const pasted = await readText({ signal: controller.signal });
```

### `readImage(options?: ReadOptions): Promise<Blob>`

Returns the first image payload on the clipboard as a `Blob`. Rejects with `UNSUPPORTED`, `PERMISSION_DENIED`, or `INVALID_PAYLOAD` (no image present) as appropriate.

```ts
const blob = await readImage();
img.src = URL.createObjectURL(blob);
```

### `readFiles(options?: ReadOptions): Promise<File[]>`

Collects non-plain-text clipboard entries (images, HTML, custom formats) as `File` objects. Returns `[]` when only plain text is present.

```ts
for (const file of await readFiles()) {
  upload(file);
}
```

### `clear(): Promise<void>`

Overwrites the clipboard with an empty string. Rejects where the async Clipboard API is unavailable or denied.

```ts
await clear();
```

### `isSupported(): boolean`

Returns `true` if any clipboard strategy (async Clipboard API or `execCommand` fallback) is available. Safe to call in SSR/Node environments.

### `getCapabilities(): FerryCapabilities`

Fine-grained support detection — branch on concrete features instead of user agents:

```ts
const caps = getCapabilities();
// { asyncWrite, asyncRead, asyncItems, execCommand, permissionsApi }
if (!caps.asyncItems) showToast('Image copy needs a newer browser');
```

### `queryPermission(action?: 'read' | 'write'): Promise<FerryPermissionState>`

Surfaces the #1 silent failure mode — a denied permission — before it bites:

```ts
const state = await queryPermission('write');
// 'granted' | 'denied' | 'prompt' | 'unsupported'
if (state === 'denied') showPermissionHelp();
```

Read-style APIs accept `{ signal }` for cancellation, and every API rejects with a `FerryError` (see [Error handling](#error-handling)).

## Framework adapters

All three hooks share one contract: `copy(content, options?)` returning `Promise<boolean>`, reactive `copied`, reactive `error`, and `reset()`. Options (including `retries` and `timeout`) pass straight through to the core.

### React (optional)

`react >=17` is an optional peer dependency — the core library stays zero-dependency without it.

```tsx
import { useClipboard } from 'ferry/react';

function CopyButton() {
  const { copy, copied, error } = useClipboard();
  return (
    <button onClick={() => copy('hello')}>
      {copied ? 'Copied!' : error ? 'Failed' : 'Copy'}
    </button>
  );
}
```

### Vue (optional)

`vue >=3.3` is an optional peer dependency — the core library stays zero-dependency without it.

```vue
<script setup lang="ts">
import { useClipboard } from 'ferry/vue';

const { copy, copied, error } = useClipboard();
</script>

<template>
  <button @click="copy('hello')">
    {{ copied ? 'Copied!' : error ? 'Failed' : 'Copy' }}
  </button>
</template>
```

### Svelte (optional)

`svelte >=3` is an optional peer dependency — plain `svelte/store` writables, so the same hook works across Svelte 3, 4, and 5.

```svelte
<script lang="ts">
  import { useClipboard } from 'ferry/svelte';

  const { copy, copied, error } = useClipboard();
</script>

<button on:click={() => copy('hello')}>
  {$copied ? 'Copied!' : $error ? 'Failed' : 'Copy'}
</button>
```

### Exports map

| Import | Ships | For |
|---|---|---|
| `ferry` | ESM + CJS + types | The core API |
| `ferry/react` | ESM + CJS + types | `useClipboard` hook |
| `ferry/vue` | ESM + CJS + types | `useClipboard` composable |
| `ferry/svelte` | ESM + CJS + types | `useClipboard` store hook |
| `dist/ferry.global.js` | IIFE | `window.Ferry` via CDN |

Framework packages are **optional peers** — install only the ones you use; the core never imports them.

## CDN / script tag

No bundler? Use the global build — the full API hangs off `window.Ferry`:

```html
<script src="https://cdn.jsdelivr.net/gh/Cleverprogramer/ferry@main/dist/ferry.global.js"></script>
<script>
  Ferry.copyToClipboard('hello!');
</script>
```

## Error handling

Every API rejects with a `FerryError` carrying a stable, switchable `code`:

| Code | Meaning | Common fix |
|---|---|---|
| `UNSUPPORTED` | No clipboard strategy in this environment | Feature-detect and show a fallback UI |
| `PERMISSION_DENIED` | The browser denied clipboard access | Ask again; link to browser permission settings |
| `COPY_FAILED` | The copy attempt itself failed | Retry (or enable `retries`) |
| `INVALID_PAYLOAD` | The value cannot go on a clipboard | Fix the input (JSON-safe, Element, image type) |
| `FETCH_FAILED` | A URL passed to `copyImage` could not be fetched | Check the URL / CORS |
| `ABORTED` | The caller's `signal` fired or `timeout` expired | Expected when cancelled — usually safe to ignore |

```ts
import { copyToClipboard, FerryError } from 'ferry';

try {
  await copyToClipboard(text);
} catch (err) {
  if (err instanceof FerryError && err.code === 'PERMISSION_DENIED') {
    showPermissionHelp();
  }
}
```

## Contributing

The workflow is issue-first: open an issue describing the feature or fix, then reference it from your PR (`Fixes #12`).

Every meaningful PR should include a changeset so releases are generated automatically:

```bash
bunx changeset   # choose patch/minor/major and write a short summary
```

Commit the generated `.changeset/*.md` file with your PR. On merge to `main`, changesets accumulates entries, opens a **Version Packages PR** automatically, and merging that PR tags the release and drafts the GitHub release — no manual version surgery.

## Development

```bash
bun install
bun test                      # unit tests (85, happy-dom)
bun run test:e2e              # browser tests (14, Playwright + Chromium)
bun run build                 # emit dist/ (modules, CDN global, declarations)
bun scripts/check-size.ts     # gzip size budgets per bundle
bun scripts/check-package.ts  # npm tarball contents audit
bun run lint && bun run format:check
```

CI runs all of the above (plus `are-the-types-wrong` on the packed tarball) on every PR, and the release pipeline turns merged changesets into tags and draft releases hands-free.

## License

[MIT](LICENSE)
