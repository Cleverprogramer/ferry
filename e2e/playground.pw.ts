import pkg from '@playwright/test';
const { test, expect } = pkg;

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4173',
  });
  await page.goto('/');
  await expect(page.locator('#supported')).toContainText('clipboard supported');
});

test('playground loads the ferry global', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('ferry');
  await expect(page.locator('#supported')).toContainText('supported');
});

test('copyToClipboard plain text round-trips through the real clipboard', async ({ page }) => {
  await page.locator('button[data-act="copyPlain"]').click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe('hello from ferry! 🚢');
  await expect(page.locator('#outPlain')).toContainText('copied');
});

test('rich copy writes both text/html and text/plain slots', async ({ page }) => {
  await page.locator('button[data-act="copyRich"]').click();
  const result = await page.evaluate(async () => {
    const item = (await navigator.clipboard.read())[0];
    return {
      html: await item.getType('text/html').then((b) => b.text()),
      text: await item.getType('text/plain').then((b) => b.text()),
    };
  });
  expect(result.html).toContain('<b>bold!</b>');
  expect(result.text).toContain('bold!');
  await expect(page.locator('#outRich')).toContainText('copied');
});

test('distinct-slot copy puts clean text in the plain slot', async ({ page }) => {
  await page.locator('button[data-act="copySlots"]').click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).not.toContain('<b>');
  expect(text).toContain('bold!');
});

test('copyJson copies pretty JSON', async ({ page }) => {
  await page.locator('button[data-act="copyJson"]').click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('"library"');
  expect(text).toContain('"deps"');
  await expect(page.locator('#outJson')).toContainText('copied');
});

test('isSupported reports true in a real browser', async ({ page }) => {
  await page.locator('button[data-act="supported"]').click();
  await expect(page.locator('#outJson')).toContainText('Ferry.isSupported() → true');
});

test('clear() wipes the clipboard', async ({ page }) => {
  await page.evaluate(() => navigator.clipboard.writeText('temporary'));
  await page.locator('button[data-act="clear"]').click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe('');
  await expect(page.locator('#outJson')).toContainText('cleared');
});
