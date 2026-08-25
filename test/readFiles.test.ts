import { afterEach, describe, expect, it } from 'bun:test';
import { readFiles, FerryError } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

Object.defineProperty(globalThis, 'ClipboardItem', {
  configurable: true,
  value: class {},
});

const makeItem = (types: string[]) => ({
  types,
  getType: async (type: string) => new Blob(['x'], { type }),
});

afterEach(() => setClipboard(undefined));

describe('readFiles', () => {
  it('wraps non-text entries into File objects with derived names', async () => {
    setClipboard({ read: async () => [makeItem(['text/plain', 'image/png'])] });

    const files = await readFiles();
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('clipboard-1.png');
    expect(files[0].type).toBe('image/png');
  });

  it('returns an empty array when only plain text is present', async () => {
    setClipboard({ read: async () => [makeItem(['text/plain'])] });

    expect(await readFiles()).toEqual([]);
  });

  it('rejects with UNSUPPORTED where clipboard.read is missing', async () => {
    setClipboard({ writeText: async () => {} });

    try {
      await readFiles();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('UNSUPPORTED');
    }
  });

  it('rejects with PERMISSION_DENIED when reading is blocked', async () => {
    setClipboard({
      read: async () => {
        throw new Error('NotAllowedError');
      },
    });

    try {
      await readFiles();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('PERMISSION_DENIED');
    }
  });
});
