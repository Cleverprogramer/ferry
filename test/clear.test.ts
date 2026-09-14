import { afterEach, describe, expect, it } from 'bun:test';
import { clear, FerryError } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('clear', () => {
  it('writes an empty string over the clipboard', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    await clear();
    expect(written).toEqual(['']);
  });

  it('rejects with UNSUPPORTED where no async API exists', async () => {
    setClipboard(undefined);

    try {
      await clear();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('UNSUPPORTED');
    }
  });

  it('rejects with PERMISSION_DENIED when the write fails', async () => {
    setClipboard({
      writeText: async () => {
        throw new Error('denied');
      },
    });

    try {
      await clear();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('PERMISSION_DENIED');
    }
  });
});

describe('clear signal support', () => {
  const setWrite = (value: unknown) => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value,
    });
  };

  afterEach(() => setWrite(undefined));

  it('rejects mid-flight when the signal fires', async () => {
    setWrite({ writeText: () => new Promise(() => {}) });
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    await expect(clear({ signal: controller.signal })).rejects.toThrow('the operation was aborted');
  });

  it('rejects before touching the clipboard when pre-aborted', async () => {
    let calls = 0;
    setWrite({
      writeText: async () => {
        calls++;
      },
    });
    const controller = new AbortController();
    controller.abort();
    await expect(clear({ signal: controller.signal })).rejects.toThrow('aborted');
    expect(calls).toBe(0);
  });
});
