import { describe, expect, it } from 'bun:test';
import { copyToClipboard } from '../src/index';

const stubWrite = (impl: () => Promise<void>) => {
  let calls = 0;
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {
        calls++;
        return impl();
      },
    },
  });
  return {
    get calls() {
      return calls;
    },
  };
};

describe('copyToClipboard timeout', () => {
  it('rejects with a descriptive ABORTED error when the write hangs', async () => {
    stubWrite(() => new Promise(() => {}));
    await expect(copyToClipboard('x', { timeout: 40 })).rejects.toThrow('timed out after 40ms');
  });

  it('deadline spans all retry attempts', async () => {
    const stub = stubWrite(() => new Promise(() => {}));
    await expect(copyToClipboard('x', { timeout: 50, retries: 10, retryDelay: 1 })).rejects.toThrow(
      'timed out',
    );
    expect(stub.calls).toBe(1); // the hanging first attempt; no further retries
  });

  it('does not impose a timeout by default — outer abort still works', async () => {
    const stub = stubWrite(() => new Promise(() => {}));
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 40);
    await expect(copyToClipboard('x', { signal: controller.signal })).rejects.toThrow(
      'the operation was aborted',
    );
    expect(stub.calls).toBe(1);
  });

  it('clears the deadline timer on success', async () => {
    stubWrite(async () => {});
    await copyToClipboard('x', { timeout: 30 });
    await new Promise((resolve) => setTimeout(resolve, 60)); // would reject if the timer fired
  });
});
