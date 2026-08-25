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
  value: class {},
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
