(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, describe, expect, it } from 'bun:test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useClipboard } from '../src/use-clipboard';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('useClipboard', () => {
  it('copies through the underlying API and flips copied to true', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    const { result } = renderHook(() => useClipboard({ copiedTimeout: 0 }));
    await act(async () => {
      await result.current.copy('hooked!');
    });
    expect(written).toEqual(['hooked!']);
    await waitFor(() => expect(result.current.copied).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('auto-resets copied after copiedTimeout', async () => {
    setClipboard({ writeText: async () => {} });

    const { result } = renderHook(() => useClipboard({ copiedTimeout: 30 }));
    await act(async () => {
      await result.current.copy('x');
    });
    await waitFor(() => expect(result.current.copied).toBe(true));
    await waitFor(() => expect(result.current.copied).toBe(false), { timeout: 1000 });
  }, 5000);

  it('surfaces errors instead of throwing, keeping copied false', async () => {
    setClipboard(undefined);

    const { result } = renderHook(() => useClipboard({ copiedTimeout: 0 }));
    await act(async () => {
      await result.current.copy('nope');
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.copied).toBe(false);
  });

  it('reset() clears error state manually', async () => {
    setClipboard(undefined);

    const { result } = renderHook(() => useClipboard({ copiedTimeout: 0 }));
    await act(async () => {
      await result.current.copy('nope');
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => {
      result.current.reset();
    });
    expect(result.current.error).toBeNull();
  });
});

describe('useClipboard options passthrough', () => {
  it('retries transient failures when options.retries is set', async () => {
    let calls = 0;
    setClipboard({
      writeText: async () => {
        calls++;
        if (calls < 3) throw new Error('transient');
      },
    });

    const { result } = renderHook(() => useClipboard({ copiedTimeout: 0 }));
    const ok = await act(async () => {
      const value = await result.current.copy('x', { retries: 3, retryDelay: 1 });
      return value;
    });
    expect(ok).toBe(true);
    expect(calls).toBe(3);
    await waitFor(() => expect(result.current.copied).toBe(true));
  });

  it('surfaces the final error when retries are exhausted', async () => {
    let calls = 0;
    setClipboard({
      writeText: async () => {
        calls++;
        throw new Error('always down');
      },
    });

    const { result } = renderHook(() => useClipboard({ copiedTimeout: 0 }));
    await act(async () => {
      await result.current.copy('x', { retries: 2, retryDelay: 1 });
    });
    expect(calls).toBe(3);
    await waitFor(() => expect(result.current.error?.message).toBe('always down'));
    expect(result.current.copied).toBe(false);
  });
});
