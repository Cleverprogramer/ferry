import { afterEach, describe, expect, it } from 'bun:test';
import { copyElement, FerryError } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

afterEach(() => setClipboard(undefined));

describe('copyElement', () => {
  it('copies the outerHTML of a DOM element as rich content', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (t: string) => void written.push(t) });
    const el = document.createElement('div');
    el.innerHTML = '<b>hi</b>';

    await copyElement(el);
    expect(written).toEqual(['<div><b>hi</b></div>']);
  });

  it('rejects with INVALID_PAYLOAD for non-elements', async () => {
    setClipboard({ writeText: async () => {} });

    try {
      await copyElement('not-an-element' as unknown as Element);
      expect.unreachable();
    } catch (err) {
      expect((err as FerryError).code).toBe('INVALID_PAYLOAD');
    }
  });
});
