import { afterEach, describe, expect, it } from 'bun:test';
import { readText } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => {
  setClipboard(undefined);
});

describe('readText', () => {
  it('returns the clipboard text when the async API allows it', async () => {
    setClipboard({ readText: async () => 'boarded cargo' });

    await expect(readText()).resolves.toBe('boarded cargo');
  });

  it('rejects when no read capability exists', async () => {
    setClipboard({ writeText: async () => {} });

    await expect(readText()).rejects.toThrow('ferry: reading the clipboard is not supported');
  });

  it('rejects with a permission-oriented error when the browser blocks reading', async () => {
    setClipboard({
      readText: async () => {
        throw new Error('NotAllowedError');
      },
    });

    await expect(readText()).rejects.toThrow(
      'ferry: clipboard read was blocked by the browser or denied by the user',
    );
  });
});
