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
