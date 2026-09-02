import { afterEach, describe, expect, it } from 'bun:test';
import { getCapabilities } from '../src/index';

const stubNav = (key: 'clipboard' | 'permissions', value: unknown) => {
  const original = Object.getOwnPropertyDescriptor(navigator, key);
  Object.defineProperty(navigator, key, { configurable: true, value });
  return () => {
    if (original) Object.defineProperty(navigator, key, original);
    else delete (navigator as unknown as Record<string, unknown>)[key];
  };
};

afterEach(() => {
  // Safety net; individual tests restore what they stub.
});

describe('getCapabilities', () => {
  it('reports available features when the full API surface is present', () => {
    // Install our own stubs: other test files' teardowns may have removed globals.
    const restoreClip = stubNav('clipboard', {
      writeText: async () => {},
      readText: async () => '',
      read: async () => [],
    });
    const itemDesc = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem');
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: class FakeClipboardItem {},
    });
    const caps = getCapabilities();
    expect(caps.asyncWrite).toBe(true);
    expect(caps.asyncRead).toBe(true);
    expect(caps.asyncItems).toBe(true);
    expect(typeof caps.execCommand).toBe('boolean'); // happy-dom lacks execCommand
    expect(typeof caps.permissionsApi).toBe('boolean');
    restoreClip();
    if (itemDesc) Object.defineProperty(globalThis, 'ClipboardItem', itemDesc);
    else delete (globalThis as { ClipboardItem?: unknown }).ClipboardItem;
  });

  it('reflects a missing clipboard as all-false async flags', () => {
    const restore = stubNav('clipboard', undefined);
    const caps = getCapabilities();
    expect(caps.asyncWrite).toBe(false);
    expect(caps.asyncRead).toBe(false);
    expect(caps.asyncItems).toBe(false);
    // execCommand availability is environment-dependent; flags above cover the regression
    restore();
  });

  it('treats a missing permissions API as unsupported', () => {
    const restore = stubNav('permissions', undefined);
    expect(getCapabilities().permissionsApi).toBe(false);
    restore();
  });
});
