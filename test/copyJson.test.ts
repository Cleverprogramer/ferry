import { afterEach, describe, expect, it } from 'bun:test';
import { copyJson, FerryError } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('copyJson', () => {
  it('copies compact JSON by default', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    await copyJson({ a: 1, b: [2, 3] });
    expect(written).toEqual(['{"a":1,"b":[2,3]}']);
  });

  it('pretty-prints with two spaces when requested', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });

    await copyJson({ a: 1 }, true);
    expect(written).toEqual(['{\n  "a": 1\n}']);
  });

  it('rejects with INVALID_PAYLOAD for unserializable values', async () => {
    setClipboard({ writeText: async () => {} });

    try {
      await copyJson({ big: 1n });
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('INVALID_PAYLOAD');
    }
  });
});
