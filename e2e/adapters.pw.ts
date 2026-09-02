import pkg from '@playwright/test';
const { test, expect } = pkg;

test.describe('framework adapters demo', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:4173',
    });
    await page.goto('/');
  });

  test('renders the React hook demo section', async ({ page }) => {
    await expect(page.locator('#react-demo-root button')).toContainText('Copy via useClipboard()');
  });

  test('copies through the hook into the real clipboard', async ({ page }) => {
    await page.locator('#react-demo-root button').click();
    await expect(page.locator('#react-demo-root button')).toContainText('Copied!');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toBe('copied via useClipboard() 🎣');
  });

  test('button label resets after copiedTimeout', async ({ page }) => {
    await page.locator('#react-demo-root button').click();
    await expect(page.locator('#react-demo-root button')).toContainText('Copied!');
    await expect(page.locator('#react-demo-root button')).toContainText('Copy via useClipboard()', {
      timeout: 4000,
    });
  });
});

test.describe('vue composable demo', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:4173',
    });
    await page.goto('/');
  });

  test('renders the Vue composable demo section', async ({ page }) => {
    await expect(page.locator('#vue-demo-root button')).toContainText('Copy via useClipboard()');
  });

  test('copies through the Vue composable into the real clipboard', async ({ page }) => {
    await page.locator('#vue-demo-root button').click();
    await expect(page.locator('#vue-demo-root button')).toContainText('Copied!');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toBe('copied via useClipboard() 🧩');
  });
});
