# ferry

`import {copyToClipboard} from 'ferry'`

A tiny zero-dependency browser utility that ferries text and rich HTML onto the clipboard.
Built and managed with [bun](https://bun.sh).

Ships dual **ESM + CJS** bundles with TypeScript declarations — works with `import`, `require()`, bundlers, and CDNs.

## API

### `copyToClipboard(content: string, richHtml?: boolean | CopyOptions): Promise<void>`
Copies text (or rich HTML when `richHtml` is `true`) to the clipboard. Rejects with an `Error` if copying fails or the environment has no clipboard support.

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

