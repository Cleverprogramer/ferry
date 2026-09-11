import { afterEach, describe, expect, it } from 'bun:test';
import { readFiles, readImage, readText } from '../src/index';

const never = () => new Promise<never>(() => {});

const installHangingRead = () => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      readText: never,
      read: never,
    },
  });
  // readImage/readFiles pre-check the asyncItems capability first
  if (typeof globalThis.ClipboardItem === 'undefined') {
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: class FakeClipboardItem {},
    });
  }
};

afterEach(() => {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(globalThis, 'ClipboardItem', {
    configurable: true,
    value: undefined,
  });
});

describe('read APIs abort mid-flight', () => {
  it('readText rejects as soon as the signal fires', async () => {
    installHangingRead();
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    await expect(readText({ signal: controller.signal })).rejects.toThrow(
      'the operation was aborted',
    );
  });

  it('readImage rejects as soon as the signal fires', async () => {
    installHangingRead();
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    await expect(readImage({ signal: controller.signal })).rejects.toThrow(
      'the operation was aborted',
    );
  });

  it('readFiles rejects as soon as the signal fires', async () => {
    installHangingRead();
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    await expect(readFiles({ signal: controller.signal })).rejects.toThrow(
      'the operation was aborted',
    );
  });

  it('pre-aborted signals reject before touching the clipboard', async () => {
    installHangingRead();
    const controller = new AbortController();
    controller.abort();
    await expect(readText({ signal: controller.signal })).rejects.toThrow('aborted');
  });
});
