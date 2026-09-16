import pkg from '@playwright/test';
const { test, expect } = pkg;

// Proves the copy-side behaviors (retries, backoff, timeout, mid-flight
// abort) in real Chromium: addInitScript installs a clipboard stub the tests
// drive after load, then ferry's CDN global runs against it unmodified.
test.describe('clipboard behaviors in real Chromium', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:4173',
    });
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__stubClipboard = (mode: string, failTimes: number) => {
        let calls = 0;
        const real = navigator.clipboard.writeText.bind(navigator.clipboard);
        const writeText =
          mode === 'hang'
            ? () => new Promise<void>(() => {})
            : async (t: string) => {
                calls += 1;
                if (calls <= failTimes) throw new Error('transient');
                await real(t);
              };
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText,
            readText: navigator.clipboard.readText.bind(navigator.clipboard),
          },
        });
        w.__writeCalls = () => calls;
      };
    });
    await page.goto('/');
  });

  test('retries recover a flaky write and land the real text', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__stubClipboard('flaky', 2);
    });
    const result = await page.evaluate(async () => {
      const F = (window as unknown as { Ferry: typeof import('../src/index') }).Ferry;
      try {
        await F.copyToClipboard('retry me', { retries: 3, retryDelay: 10 });
        return { ok: true };
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });
    expect(result).toEqual({ ok: true });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('retry me');
    expect(
      await page.evaluate(() => (window as unknown as Record<string, () => number>).__writeCalls()),
    ).toBe(3);
  });

  test('exhausted retries surface the transient failure', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__stubClipboard('flaky', 99);
    });
    const result = await page.evaluate(async () => {
      const F = (window as unknown as { Ferry: typeof import('../src/index') }).Ferry;
      try {
        await F.copyToClipboard('doomed', { retries: 2, retryDelay: 10 });
        return { ok: true };
      } catch (err) {
        return { ok: false, message: (err as Error).message };
      }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('transient');
    expect(
      await page.evaluate(() => (window as unknown as Record<string, () => number>).__writeCalls()),
    ).toBe(3);
  });

  test('timeout rejects ABORTED against a hanging write', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__stubClipboard('hang', 0);
    });
    const result = await page.evaluate(async () => {
      const F = (window as unknown as { Ferry: typeof import('../src/index') }).Ferry;
      const started = Date.now();
      try {
        await F.copyToClipboard('hang on', { timeout: 400 });
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          code: (err as { code?: string }).code,
          message: (err as Error).message,
          elapsed: Date.now() - started,
        };
      }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('ABORTED');
      expect(result.message).toContain('timed out after 400ms');
      expect(result.elapsed).toBeLessThan(3000);
    }
  });

  test('mid-flight abort rejects against a hanging write', async ({ page }) => {
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__stubClipboard('hang', 0);
    });
    const result = await page.evaluate(async () => {
      const F = (window as unknown as { Ferry: typeof import('../src/index') }).Ferry;
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 150);
      try {
        await F.copyToClipboard('abort me', { signal: controller.signal });
        return { ok: true };
      } catch (err) {
        return { ok: false, code: (err as { code?: string }).code };
      }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('ABORTED');
  });
});
