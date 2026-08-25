import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'bun:test';

const cdnBundle = 'dist/ferry.global.js';
const built = existsSync(cdnBundle);

describe('CDN global bundle', () => {
  it.skipIf(!built)('exposes the full API as window.Ferry', () => {
    const code = readFileSync(cdnBundle, 'utf8');
    const factory = new Function(
      `${code};\nreturn typeof Ferry === 'object' || typeof Ferry === 'function' ? Ferry : undefined;`,
    );
    const Ferry = factory();

    expect(Ferry).toBeDefined();
    expect(typeof Ferry.copyToClipboard).toBe('function');
    expect(typeof Ferry.isSupported).toBe('function');
    expect(typeof Ferry.readText).toBe('function');
    expect(typeof Ferry.copyImage).toBe('function');
    expect(typeof Ferry.readImage).toBe('function');
    expect(typeof Ferry.readFiles).toBe('function');
    expect(typeof Ferry.clear).toBe('function');
    expect(typeof Ferry.copyJson).toBe('function');
    expect(typeof Ferry.copyElement).toBe('function');
  });
});
