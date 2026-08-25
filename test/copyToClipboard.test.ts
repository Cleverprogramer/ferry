import { afterEach, describe, expect, it } from 'bun:test';
import { copyToClipboard, isSupported, type RichCopyOptions } from '../src/index';

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
  document.addEventListener = ((
    type: string,
    cb: (e: unknown) => void,
    opts?: unknown,
  ) => {
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

    await expect(copyToClipboard('x')).rejects.toThrow(
      'ferry: no clipboard support detected',
    );
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

    const slots = await captureCopySlots(() => copyToClipboard('ignored', { html: '<i>slick</i>' }));
    expect(executed).toBe(true);
    expect(slots['text/html']).toBe('<i>slick</i>');
    expect(slots['text/plain']).toBe('ignored');
    expect(written).toEqual([]);
  });
});
