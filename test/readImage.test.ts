import { afterEach, describe, expect, it } from 'bun:test';
import { readImage, FerryError } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

const makeItem = (types: string[]) => ({
  types,
  getType: async (type: string) => new Blob(['x'], { type }),
});

// happy-dom does not implement ClipboardItem; the stub only needs to exist.
Object.defineProperty(globalThis, 'ClipboardItem', {
  configurable: true,
  value: class {},
});

afterEach(() => setClipboard(undefined));

describe('readImage', () => {
  it('returns the first image blob on the clipboard', async () => {
    setClipboard({ read: async () => [makeItem(['text/plain', 'image/png'])] });

    const blob = await readImage();
    expect(blob.type).toBe('image/png');
  });

  it('rejects with INVALID_PAYLOAD when only text is present', async () => {
    setClipboard({ read: async () => [makeItem(['text/plain'])] });

    try {
      await readImage();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('INVALID_PAYLOAD');
    }
  });

  it('rejects with PERMISSION_DENIED when reading is blocked', async () => {
    setClipboard({
      read: async () => {
        throw new Error('NotAllowedError');
      },
    });

    try {
      await readImage();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('PERMISSION_DENIED');
    }
  });

  it('rejects with UNSUPPORTED where clipboard.read is missing', async () => {
    setClipboard({ writeText: async () => {} });

    try {
      await readImage();
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('UNSUPPORTED');
    }
  });
});
