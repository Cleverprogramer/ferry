import { afterEach, describe, expect, it } from 'bun:test';
import { copyImage, copyToClipboard, readText } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

Object.defineProperty(globalThis, 'ClipboardItem', {
  configurable: true,
  value: class FakeClipboardItem {
    data: Record<string, unknown>;
    constructor(data: Record<string, unknown>) {
      this.data = data;
    }
  },
});

describe('AbortSignal support', () => {
  it('rejects ABORTED when already aborted before copying', async () => {
    setClipboard({ writeText: async () => {} });
    const controller = new AbortController();
    controller.abort();

    await expect(
      copyToClipboard('x', { signal: controller.signal }),
    ).rejects.toMatchObject({ code: 'ABORTED' });
  });

  it('does not touch the clipboard when aborted', async () => {
    let called = false;
    setClipboard({
      writeText: async () => {
        called = true;
      },
    });
    const controller = new AbortController();
    controller.abort();

    await copyToClipboard('x', { signal: controller.signal }).catch(() => {});
    expect(called).toBe(false);
  });

  it('aborts readText before reading', async () => {
    setClipboard({ readText: async () => 'secret' });
    const controller = new AbortController();
    controller.abort();

    await expect(readText({ signal: controller.signal })).rejects.toMatchObject({
      code: 'ABORTED',
    });
  });

  it('passes the signal to fetch for URL image copies', async () => {
    setClipboard({ write: async () => {} });
    const seen: RequestInit[] = [];
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
      seen.push(init ?? {});
      return new Response(new Blob(['x'], { type: 'image/png' }), { status: 200 });
    }) as typeof fetch;

    const controller = new AbortController();
    await copyImage('https://example.com/a.png', { signal: controller.signal });
    expect(seen[0].signal).toBe(controller.signal);
  });
});

describe('copyImage async factories (Safari-safe)', () => {
  it('hands the raw promise to ClipboardItem when a type is provided', async () => {
    const captured: Array<Record<string, unknown>> = [];
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { write: async (items: Array<Record<string, unknown>>) => void captured.push(...items) },
    });
    const blob = new Blob(['x'], { type: 'image/png' });

    await copyImage(() => Promise.resolve(blob), { type: 'image/png' });
    expect(captured).toHaveLength(1);
    const item = captured[0] as { data: Record<string, unknown> };
    expect(item.data['image/png']).toBeInstanceOf(Promise);
  });

  it('rejects with INVALID_PAYLOAD when a factory omits the type option', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { write: async () => {} },
    });

    try {
      await copyImage(() => Promise.resolve(new Blob(['x'], { type: 'image/png' })));
      expect.unreachable();
    } catch (err) {
      expect((err as import('../src/index').FerryError).code).toBe('INVALID_PAYLOAD');
    }
  });
});

describe('prefer strategy option', () => {
  it("prefer: 'fallback' skips the async API even when available", async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });
    let executed = false;
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: () => {
        executed = true;
        return true;
      },
      writable: true,
    });

    await copyToClipboard('legacy', { prefer: 'fallback' });
    expect(executed).toBe(true);
    expect(written).toEqual([]);
  });

  it("prefer: 'async' uses the Clipboard API as usual", async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    await copyToClipboard('modern', { prefer: 'async' });
    expect(written).toEqual(['modern']);
  });

  it("prefer: 'fallback' without execCommand support rejects COPY_FAILED via UNSUPPORTED path", async () => {
    setClipboard({ writeText: async () => {} });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    try {
      await copyToClipboard('x', { prefer: 'fallback' });
      expect.unreachable();
    } catch (err) {
      expect((err as import('../src/index').FerryError).code).toBe('UNSUPPORTED');
    }
  });
});
