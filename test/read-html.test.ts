import { afterEach, describe, expect, it } from 'bun:test';
import { copyToClipboard, readHtml } from '../src/index';

class FakeClipboardItem {
  data: Record<string, Blob>;
  constructor(data: Record<string, Blob>) {
    this.data = data;
  }
  get types(): string[] {
    return Object.keys(this.data);
  }
  async getType(type: string): Promise<Blob> {
    const blob = this.data[type];
    if (!blob) throw new Error('type not found');
    return blob;
  }
}

const never = () => new Promise<never>(() => {});

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};
const setItemClass = (value: unknown) => {
  Object.defineProperty(globalThis, 'ClipboardItem', {
    configurable: true,
    value,
  });
};

afterEach(() => {
  setClipboard(undefined);
  setItemClass(undefined);
});

describe('readHtml', () => {
  it('reads the text/html slot from the first clipboard item', async () => {
    setItemClass(FakeClipboardItem);
    setClipboard({
      read: async () => [
        new FakeClipboardItem({
          'text/html': new Blob(['<b>rich paste</b>'], { type: 'text/html' }),
          'text/plain': new Blob(['rich paste'], { type: 'text/plain' }),
        }),
      ],
      writeText: async () => {},
    });
    await expect(readHtml()).resolves.toBe('<b>rich paste</b>');
  });

  it('rejects INVALID_PAYLOAD when no html slot exists', async () => {
    setItemClass(FakeClipboardItem);
    setClipboard({
      read: async () => [new FakeClipboardItem({ 'text/plain': new Blob(['plain']) })],
    });
    await expect(readHtml()).rejects.toThrow('the clipboard has no text/html slot');
  });

  it('rejects INVALID_PAYLOAD when the clipboard is empty', async () => {
    setItemClass(FakeClipboardItem);
    setClipboard({ read: async () => [] });
    await expect(readHtml()).rejects.toThrow('no text/html slot');
  });

  it('rejects UNSUPPORTED without ClipboardItem support', async () => {
    setItemClass(undefined);
    setClipboard({ read: never, writeText: async () => {} });
    await expect(readHtml()).rejects.toThrow(
      'reading rich HTML from the clipboard is not supported',
    );
  });

  it('rejects ABORTED mid-flight when the signal fires', async () => {
    setItemClass(FakeClipboardItem);
    setClipboard({ read: never, writeText: async () => {} });
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 25);
    await expect(readHtml({ signal: controller.signal })).rejects.toThrow('aborted');
  });

  it('round-trips markup written by copyToClipboard rich path', async () => {
    setItemClass(FakeClipboardItem);
    const stored = new FakeClipboardItem({
      'text/html': new Blob([], { type: 'text/html' }),
      'text/plain': new Blob([], { type: 'text/plain' }),
    });
    setClipboard({
      write: async (items: Array<FakeClipboardItem>) => {
        Object.assign(stored.data, items[0].data);
      },
      read: async () => [stored],
      writeText: async () => {},
    });
    await copyToClipboard('<i>from ferry</i>', true);
    await expect(readHtml()).resolves.toBe('<i>from ferry</i>');
  });
});
