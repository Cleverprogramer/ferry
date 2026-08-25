import { afterEach, describe, expect, it } from 'bun:test';
import { copyToClipboard, isSupported } from '../src/index';

const setClipboard = (value: unknown) => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value,
  });
};

const setExecCommand = (impl: ((command: string) => boolean) | undefined) => {
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: impl,
    writable: true,
  });
};

afterEach(() => {
  setClipboard(undefined);
  setExecCommand(undefined);
});

describe('isSupported', () => {
  it('returns true when the async Clipboard API is available', () => {
    setClipboard({ writeText: async () => {} });
    expect(isSupported()).toBe(true);
  });

  it('returns true when only the execCommand fallback exists', () => {
    setClipboard(undefined);
    setExecCommand(() => true);
    expect(isSupported()).toBe(true);
  });

  it('returns false when no strategy is available', () => {
    setClipboard(undefined);
    setExecCommand(undefined);
    expect(isSupported()).toBe(false);
  });
});

describe('copyToClipboard', () => {
  it('writes plain text through the async Clipboard API when available', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (text: string) => void written.push(text) });

    await copyToClipboard('hello');
    expect(written).toEqual(['hello']);
  });

  it('falls back to a hidden textarea + execCommand when no Clipboard API exists', async () => {
    setClipboard(undefined);
    let executed = false;
    setExecCommand(() => {
      executed = true;
      return true;
    });

    await copyToClipboard('legacy');
    expect(executed).toBe(true);
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('uses the fallback for rich HTML copies', async () => {
    const written: string[] = [];
    setClipboard({ writeText: async (text: string) => void written.push(text) });
    let executed = false;
    setExecCommand(() => {
      executed = true;
      return true;
    });

    await copyToClipboard('<b>bold</b>', true);
    expect(executed).toBe(true);
    expect(written).toEqual([]);
  });

  it('rejects when the execCommand fallback reports failure', async () => {
    setClipboard(undefined);
    setExecCommand(() => false);

    await expect(copyToClipboard('nope', true)).rejects.toThrow(
      'ferry: execCommand("copy") fallback failed',
    );
  });

  it('rejects in environments without any clipboard support', async () => {
    setClipboard(undefined);
    setExecCommand(undefined);

    await expect(copyToClipboard('x')).rejects.toThrow(
      'ferry: no clipboard support detected',
    );
  });

  it('propagates writeText rejections to the caller', async () => {
    setClipboard({
      writeText: async () => {
        throw new Error('denied');
      },
    });

    await expect(copyToClipboard('secret')).rejects.toThrow('denied');
  });
});
