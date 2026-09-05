import { afterEach, describe, expect, it } from 'bun:test';
import { get } from 'svelte/store';
import { useClipboard } from '../src/use-clipboard-svelte';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('useClipboard (svelte)', () => {
  it('copies through the underlying API and flips the copied store', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    const { copy, copied, error } = useClipboard({ copiedTimeout: 0 });
    expect(get(copied)).toBe(false);

    const ok = await copy('hello svelte');
    expect(ok).toBe(true);
    expect(written).toEqual(['hello svelte']);
    expect(get(copied)).toBe(true);
    expect(get(error)).toBeNull();
  });

  it('auto-resets the copied store after copiedTimeout', async () => {
    setClipboard({ writeText: async () => {} });

    const { copy, copied } = useClipboard({ copiedTimeout: 30 });
    await copy('x');
    expect(get(copied)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(get(copied)).toBe(false);
  });

  it('surfaces errors instead of throwing, keeping copied false', async () => {
    setClipboard(undefined);

    const { copy, copied, error } = useClipboard({ copiedTimeout: 0 });
    const ok = await copy('nope');
    expect(ok).toBe(false);
    expect(get(copied)).toBe(false);
    expect(get(error)).toBeInstanceOf(Error);
  });

  it('passes options through so retries work', async () => {
    let calls = 0;
    setClipboard({
      writeText: async () => {
        calls++;
        if (calls < 3) throw new Error('transient');
      },
    });

    const { copy, copied } = useClipboard({ copiedTimeout: 0 });
    const ok = await copy('x', { retries: 3, retryDelay: 1 });
    expect(ok).toBe(true);
    expect(calls).toBe(3);
    expect(get(copied)).toBe(true);
  });
});
