import { afterEach, describe, expect, it } from 'bun:test';
import { copyToClipboard } from '../src/index';

class FakeClipboardItem {
  constructor(public data: Record<string, Blob>) {}
}

describe('async rich copy via ClipboardItem', () => {
  const writes: Array<Array<unknown>> = [];

  afterEach(() => {
    writes.length = 0;
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value: undefined });
  });

  const installAsync = () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async (items: Array<unknown>) => void writes.push(items),
        writeText: async () => {},
      },
    });
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: FakeClipboardItem,
    });
  };

  it('writes both slots asynchronously for rich copies', async () => {
    installAsync();
    await copyToClipboard('plain body', { html: '<b>bold</b>', text: 'plain body' });

    expect(writes).toHaveLength(1);
    const item = writes[0][0] as FakeClipboardItem;
    expect(item.data['text/html']).toBeInstanceOf(Blob);
    expect(item.data['text/plain']).toBeInstanceOf(Blob);
    await expect(item.data['text/html'].text()).resolves.toBe('<b>bold</b>');
    await expect(item.data['text/plain'].text()).resolves.toBe('plain body');
  });

  it('serves options === true (rich sugar) through the same path', async () => {
    installAsync();
    await copyToClipboard('<i>rich</i>', true);
    const item = writes[0][0] as FakeClipboardItem;
    await expect(item.data['text/html'].text()).resolves.toBe('<i>rich</i>');
    await expect(item.data['text/plain'].text()).resolves.toBe('<i>rich</i>');
  });

  it('keeps the execCommand fallback when ClipboardItem is missing', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    });
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => true });

    await copyToClipboard('<b>x</b>', { html: '<b>x</b>', text: 'x' });
    expect(writes).toHaveLength(0); // never touched the async write path
  });
});
