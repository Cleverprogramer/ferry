# ferry

`import {copyToClipboard} from 'ferry'`

A tiny zero-dependency browser utility that ferries text and rich HTML onto the clipboard.
Built and managed with [bun](https://bun.sh).

## API
`copyToClipboard(content: string, richHtml: boolean)`

## Examples

### Text

`copyToClipboard('This is normal text')`

### Rich text

`copyToClipboard('This text has a <b>bold</b> element and a <a href="https://google.com">link</a>', true)`
