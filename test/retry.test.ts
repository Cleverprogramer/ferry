import { describe, expect, it } from 'bun:test';
import { copyToClipboard } from '../src/index';

const stubWrite = (impl: () => Promise<void>) => {
  let calls = 0;
  const writeText = async () => {
    calls++;
    return impl();
  };
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return {
    get calls() {
      return calls;
    },
  };
};

describe('copyToClipboard retries', () => {
  it('succeeds after transient failures', async () => {
    let attempts = 0;
    const stub = stubWrite(async () => {
      attempts++;
      if (attempts < 3) throw new Error('transient');
    });
    await copyToClipboard('hello', { retries: 3, retryDelay: 1 });
    expect(stub.calls).toBe(3);
  });

  it('stops after the configured retries on permanent failure', async () => {
    const stub = stubWrite(async () => {
      throw new Error('always fails');
    });
    await expect(copyToClipboard('hello', { retries: 2, retryDelay: 1 })).rejects.toThrow(
      'always fails',
    );
    expect(stub.calls).toBe(3); // 1 initial + 2 retries
  });

  it('does not retry when the operation was aborted', async () => {
    const stub = stubWrite(async () => {});
    const controller = new AbortController();
    controller.abort();
    await expect(
      copyToClipboard('hello', { retries: 5, retryDelay: 1, signal: controller.signal }),
    ).rejects.toThrow('aborted');
    expect(stub.calls).toBe(0);
  });

  it('applies exponential backoff between attempts', async () => {
    let attempts = 0;
    stubWrite(async () => {
      attempts++;
      if (attempts < 3) throw new Error('transient');
    });
    const started = Date.now();
    await copyToClipboard('hello', { retries: 2, retryDelay: 25 });
    // 25ms after the first failure + 50ms after the second
    expect(Date.now() - started).toBeGreaterThanOrEqual(70);
  });

  it('does not retry by default', async () => {
    const stub = stubWrite(async () => {
      throw new Error('nope');
    });
    await expect(copyToClipboard('hello')).rejects.toThrow('nope');
    expect(stub.calls).toBe(1);
  });
});
