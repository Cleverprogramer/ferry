import { afterEach, describe, expect, it } from 'bun:test';
import { useClipboard } from '../src/use-clipboard-vue';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('useClipboard (vue)', () => {
  it('copies through the underlying API and flips the copied ref', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    const { copy, copied, error } = useClipboard({ copiedTimeout: 0 });
    expect(copied.value).toBe(false);

    const ok = await copy('hello vue');
    expect(ok).toBe(true);
    expect(written).toEqual(['hello vue']);
    expect(copied.value).toBe(true);
    expect(error.value).toBeNull();
  });

  it('auto-resets the copied ref after copiedTimeout', async () => {
    setClipboard({ writeText: async () => {} });

    const { copy, copied } = useClipboard({ copiedTimeout: 30 });
    await copy('x');
    expect(copied.value).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(copied.value).toBe(false);
  });

  it('surfaces errors on the error ref instead of throwing', async () => {
    setClipboard(undefined);

    const { copy, copied, error } = useClipboard({ copiedTimeout: 0 });
    const ok = await copy('nope');
    expect(ok).toBe(false);
    expect(copied.value).toBe(false);
    expect(error.value).not.toBeNull();
    expect((error.value as Error).message).toBe(
      'ferry: no clipboard support detected in this environment',
    );
  });

  it('reset() clears copied and error refs manually', async () => {
    setClipboard(undefined);

    const { copy, copied, error, reset } = useClipboard({ copiedTimeout: 0 });
    await copy('nope');
    expect(error.value).not.toBeNull();

    reset();
    expect(copied.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('accepts per-call options passthrough', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    const { copy } = useClipboard();
    await copy('plain', { text: 'override' });
    expect(written).toEqual(['override']);
  });
});

describe('useClipboard (vue) options passthrough', () => {
  it('retries transient failures when options.retries is set', async () => {
    let calls = 0;
    setClipboard({
      writeText: async () => {
        calls++;
        if (calls < 3) throw new Error('transient');
      },
    });

    const { copy, copied, error } = useClipboard({ copiedTimeout: 0 });
    const ok = await copy('x', { retries: 3, retryDelay: 1 });
    expect(ok).toBe(true);
    expect(calls).toBe(3);
    expect(copied.value).toBe(true);
    expect(error.value).toBeNull();
  });

  it('surfaces the final error when retries are exhausted', async () => {
    let calls = 0;
    setClipboard({
      writeText: async () => {
        calls++;
        throw new Error('always down');
      },
    });

    const { copy, copied, error } = useClipboard({ copiedTimeout: 0 });
    const ok = await copy('x', { retries: 2, retryDelay: 1 });
    expect(ok).toBe(false);
    expect(calls).toBe(3);
    expect(copied.value).toBe(false);
    expect(error.value?.message).toBe('always down');
  });
});
