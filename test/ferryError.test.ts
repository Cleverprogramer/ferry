import { afterEach, describe, expect, it } from 'bun:test';
import { copyImage, copyToClipboard, FerryError } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('FerryError', () => {
  it('carries a machine-readable code alongside the message', async () => {
    setClipboard(undefined);

    try {
      await copyToClipboard('x');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(FerryError);
      expect((err as FerryError).code).toBe('UNSUPPORTED');
      expect((err as FerryError).name).toBe('FerryError');
    }
  });

  it('codes payload problems as INVALID_PAYLOAD', async () => {
    setClipboard({ write: async () => {} });
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: class {},
    });

    try {
      await copyImage(new Blob(['t'], { type: 'text/plain' }));
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('INVALID_PAYLOAD');
    }
  });
});
