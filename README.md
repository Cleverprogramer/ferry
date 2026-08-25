# ferry 🚢

[![CI](https://github.com/Cleverprogramer/ferry/actions/workflows/ci.yml/badge.svg)](https://github.com/Cleverprogramer/ferry/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-3fb950.svg)](LICENSE)
![Bundle size](https://img.shields.io/badge/gzipped-%3C2_kB-2f81f7)

`import {copyToClipboard} from 'ferry'`

A tiny zero-dependency browser utility that ferries text and rich HTML onto the clipboard.
Built and managed with [bun](https://bun.sh).

Ships dual **ESM + CJS** bundles with TypeScript declarations — works with `import`, `require()`, bundlers, and CDNs.

🎮 **[Try the live playground →](https://cleverprogramer.github.io/ferry/)**

## Browser support

| API | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| `copyToClipboard` (async API) | ✅ 66+ | ✅ 79+ | ✅ 63+ | ✅ 13.1+ |
| `copyToClipboard` rich slots (`{html, text}`) | ✅ 66+ | ✅ 79+ | ✅ 63+ | ✅ 13.1+ |
| `isSupported`, `clear`, `copyJson`, `copyElement` | ✅ | ✅ | ✅ | ✅ |
| `readText` | ✅ 66+ | ✅ 79+ | ✅ 125+ | ✅ 13.1+ |
| `copyImage` / `readImage` (ClipboardItem) | ✅ 76+ | ✅ 79+ | ⚠️ limited | ✅ 13.1+ |
| `readFiles` | ✅ 76+ | ✅ 79+ | ⚠️ limited | ⚠️ partial |

All browsers fall back to the hidden-textarea `execCommand('copy')` path automatically where the async Clipboard API is unavailable. Clipboard **read** APIs additionally require a secure context (HTTPS/localhost) and, in some browsers, explicit user permission.

## Install

npm registry publishing is coming — until then, install straight from GitHub:

```bash
# from this repo (latest main)
bun add github:Cleverprogramer/ferry
npm i github:Cleverprogramer/ferry
yarn add github:Cleverprogramer/ferry
```

Or drop it into any page via jsDelivr's GitHub CDN — no build tools needed:

```html
<script src="https://cdn.jsdelivr.net/gh/Cleverprogramer/ferry@main/dist/ferry.global.js"></script>
<script>
  Ferry.copyToClipboard('hello!');
</script>
```

## API

### `copyToClipboard(content: string, richHtml?: boolean | CopyOptions): Promise<void>`
Copies text (or rich HTML when `richHtml` is `true`) to the clipboard. Rejects with an `Error` if copying fails or the environment has no clipboard support.

Every API accepts an optional `{ signal: AbortSignal }` to cancel in-flight operations (rejects with code `ABORTED`):

```ts
await readText({ signal: controller.signal });
```

Pass an options object to control each clipboard slot independently:

```ts
// Rich editors get markup; plain editors get clean text
await copyToClipboard('<b>bold</b>', { html: '<b>bold</b>', text: 'bold' });
```

### `isSupported(): boolean`
Returns `true` if any clipboard strategy (async Clipboard API or `execCommand` fallback) is available. Safe to call in SSR/Node environments.

### `readText(): Promise<string>`
Reads the clipboard's current text content. Rejects with an `Error` when reading is unsupported or permission is denied.

```ts
const pasted = await readText();
```

### `copyImage(source: Blob | string): Promise<void>`
Copies an image to the clipboard. Pass a `Blob` directly, or a URL string which ferry fetches and converts for you. Rejects when image copying is unsupported, the payload is not an image, or permission is denied.

```ts
await copyImage(canvasOrFileBlob);
await copyImage('https://example.com/cat.png');
```

Safari quirk: `ClipboardItem` must be constructed during the user gesture. Pass an async factory plus an explicit `type` and ferry hands the promise straight through:

```ts
await copyImage(() => renderCanvasToBlob(), { type: 'image/png' });
```

## Examples

### Text

`await copyToClipboard('This is normal text')`

### Rich text

`await copyToClipboard('<b>bold</b> element and a <a href="https://google.com">link</a>', true)`

### Feature detection

```ts
if (!isSupported()) {
  showFallbackUi();
}
```

### `clear(): Promise<void>`
Overwrites the clipboard with an empty string. Rejects where the async Clipboard API is unavailable or denied.

```ts
await clear();
```

### `copyJson(value: unknown, pretty?: boolean): Promise<void>`
Serializes a value to JSON and copies it. `pretty = true` uses 2-space indentation. Rejects with `INVALID_PAYLOAD` for values JSON cannot represent.

```ts
await copyJson({ hello: 'world' }, true);
```

### `copyElement(element: Element): Promise<void>`
Copies a DOM element's markup (`outerHTML`) as rich HTML content. Rejects with `INVALID_PAYLOAD` for non-elements.

```ts
document.querySelector('#chart') && await copyElement(document.querySelector('#chart')!);
```

### `readImage(): Promise<Blob>`
Returns the first image payload on the clipboard as a `Blob`. Rejects with `UNSUPPORTED`, `PERMISSION_DENIED`, or `INVALID_PAYLOAD` (no image present) as appropriate.

```ts
const blob = await readImage();
img.src = URL.createObjectURL(blob);
```

### `readFiles(): Promise<File[]>`
Collects non-plain-text clipboard entries (images, HTML, custom formats) as `File` objects. Returns `[]` when only plain text is present.

```ts
for (const file of await readFiles()) {
  upload(file);
}
```

```ts
// Force the legacy path for deterministic testing
await copyToClipboard('text', { prefer: 'fallback' });
```

### CDN / script tag

No bundler? Use the global build — the full API hangs off `window.Ferry`:

```html
<script src="https://unpkg.com/ferry/dist/ferry.global.js"></script>
<script>
  Ferry.copyToClipboard('hello!');
</script>
```

## Error handling

Every API rejects with a `FerryError` carrying a stable `code`:
`UNSUPPORTED`, `PERMISSION_DENIED`, `COPY_FAILED`, `INVALID_PAYLOAD`,
`FETCH_FAILED`, or `ABORTED` — branch on codes, not message strings.

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

## Development

```bash
bun install
bun test          # run unit tests (happy-dom)
bun run build     # emit dist/
```

