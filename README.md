# ferry

`import {copyToClipboard} from 'ferry'`

A tiny zero-dependency browser utility that ferries text and rich HTML onto the clipboard.
Built and managed with [bun](https://bun.sh).

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

## Development

```bash
bun install
bun test          # run unit tests (happy-dom)
bun run build     # emit dist/
```

