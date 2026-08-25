import { afterEach, describe, expect, it } from 'bun:test';
import { copyImage, copyToClipboard, isSupported, type RichCopyOptions } from '../src/index';

class FakeClipboardItem {
  constructor(public data: Record<string, Blob>) {}
}

const setClipboardItem = (value: unknown) => {
  Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value });
};

const imageBlob = (type = 'image/png') => new Blob(['fake-image-bytes'], { type });

const writtenItems = () => {
  const items: Array<Record<string, Blob>> = [];
  setClipboard({
    write: async (payload: Array<Record<string, Blob>>) => void items.push(...payload),
  });
  return items;
};

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

const setExecCommand = (impl: ((command: string) => boolean) | undefined) => {
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: impl,
    writable: true,
  });
};

/** Captures the copy-event listener ferry registers and invokes it with a stub event. */
const captureCopySlots = async (run: () => Promise<void>) => {
  let listener: ((e: unknown) => void) | undefined;
  const originalAdd = document.addEventListener.bind(document);
  document.addEventListener = ((type: string, cb: (e: unknown) => void, opts?: unknown) => {
    if (type === 'copy') listener = cb;
    return originalAdd(type, cb, opts);
  }) as typeof document.addEventListener;

  try {
    await run();
  } finally {
    document.addEventListener = originalAdd;
  }

  const slots: Record<string, string> = {};
  listener?.({
    preventDefault() {},
    clipboardData: { setData: (type: string, value: string) => (slots[type] = value) },
  });
  return slots;
};

afterEach(() => {
  setClipboard(undefined);
  setExecCommand(undefined);
  setClipboardItem(undefined);
});

describe('isSupported', () => {
  it('returns true when the async Clipboard API is available', () => {
    setClipboard({ writeText: async () => {} });
    expect(isSupported()).toBe(true);
  });

  it('returns true when only the execCommand fallback exists', () => {
    setClipboard(undefined);
    setExecCommand(() => true);
    expect(isSupported()).toBe(true);
  });

  it('returns false when no strategy is available', () => {
    setClipboard(undefined);
    setExecCommand(undefined);
    expect(isSupported()).toBe(false);
  });
});

describe('copyToClipboard', () => {
  it('writes plain text through the async Clipboard API when available', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (text: string) => void written.push(text) });

    await copyToClipboard('hello');
    expect(written).toEqual(['hello']);
  });

  it('falls back to a hidden textarea + execCommand when no Clipboard API exists', async () => {
    setClipboard(undefined);
    let executed = false;
    setExecCommand(() => {
      executed = true;
      return true;
    });

    await copyToClipboard('legacy');
    expect(executed).toBe(true);
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('uses the fallback for rich HTML copies', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (text: string) => void written.push(text) });
    let executed = false;
    setExecCommand(() => {
      executed = true;
      return true;
    });

    await copyToClipboard('<b>bold</b>', true);
    expect(executed).toBe(true);
    expect(written).toEqual([]);
  });

  it('rejects when the execCommand fallback reports failure', async () => {
    setClipboard(undefined);
    setExecCommand(() => false);

    await expect(copyToClipboard('nope', true)).rejects.toThrow(
      'ferry: execCommand("copy") fallback failed',
    );
  });

  it('rejects in environments without any clipboard support', async () => {
    setClipboard(undefined);
    setExecCommand(undefined);

    await expect(copyToClipboard('x')).rejects.toThrow('ferry: no clipboard support detected');
  });

  it('propagates writeText rejections to the caller', async () => {
    setClipboard({
      writeText: async () => {
        throw new Error('denied');
      },
    });

    await expect(copyToClipboard('secret')).rejects.toThrow('denied');
  });
});

describe('copyToClipboard options', () => {
  it('keeps boolean rich copy behavior: content fills both slots', async () => {
    setClipboard(undefined);
    setExecCommand(() => true);

    const slots = await captureCopySlots(() => copyToClipboard('<b>bold</b>', true));
    expect(slots['text/html']).toBe('<b>bold</b>');
    expect(slots['text/plain']).toBe('<b>bold</b>');
  });

  it('writes distinct html and text slots from an options object', async () => {
    setClipboard(undefined);
    setExecCommand(() => true);

    const options: RichCopyOptions = { html: '<b>bold</b>', text: 'bold' };
    const slots = await captureCopySlots(() => copyToClipboard('<b>bold</b>', options));
    expect(slots['text/html']).toBe('<b>bold</b>');
    expect(slots['text/plain']).toBe('bold');
  });

  it('routes explicit plain text through the async API when no html is given', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (text: string) => void written.push(text) });

    await copyToClipboard('<b>bold</b>', { text: 'bold' });
    expect(written).toEqual(['bold']);
  });

  it('forces the fallback when only html is provided', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (text: string) => void written.push(text) });
    let executed = false;
    setExecCommand(() => {
      executed = true;
      return true;
    });

    const slots = await captureCopySlots(() =>
      copyToClipboard('ignored', { html: '<i>slick</i>' }),
    );
    expect(executed).toBe(true);
    expect(slots['text/html']).toBe('<i>slick</i>');
    expect(slots['text/plain']).toBe('ignored');
    expect(written).toEqual([]);
  });
});

describe('copyImage', () => {
  it('writes an image Blob to the clipboard under its MIME type', async () => {
    const items = writtenItems();
    setClipboardItem(FakeClipboardItem);

    await copyImage(imageBlob('image/webp'));
    expect(items).toHaveLength(1);
    const [item] = items as unknown as FakeClipboardItem[];
    expect(Object.keys(item.data)).toEqual(['image/webp']);
  });

  it('fetches URL strings and copies the resulting blob', async () => {
    const items = writtenItems();
    setClipboardItem(FakeClipboardItem);
    globalThis.fetch = (async () =>
      new Response(imageBlob('image/jpeg'), { status: 200 })) as typeof fetch;

    await copyImage('https://example.com/cat.jpg');
    const [item] = items as unknown as FakeClipboardItem[];
    expect(Object.keys(item.data)).toEqual(['image/jpeg']);
  });

  it('rejects when the fetched URL fails', async () => {
    writtenItems();
    setClipboardItem(FakeClipboardItem);
    globalThis.fetch = (async () => new Response('nope', { status: 404 })) as typeof fetch;

    await expect(copyImage('https://example.com/missing.png')).rejects.toThrow('HTTP 404');
  });

  it('rejects non-image payloads', async () => {
    const items = writtenItems();
    setClipboardItem(FakeClipboardItem);

    await expect(copyImage(new Blob(['text'], { type: 'text/plain' }))).rejects.toThrow(
      'expected an image blob but received type "text/plain"',
    );
    expect(items).toHaveLength(0);
  });

  it('rejects when ClipboardItem or clipboard.write is unavailable', async () => {
    setClipboard({ writeText: async () => {} });
    setClipboardItem(undefined);

    await expect(copyImage(imageBlob())).rejects.toThrow('ferry: copying images is not supported');
  });
});
