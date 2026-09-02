import pkg from '@playwright/test';
const { defineConfig } = pkg;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  timeout: 30000,
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1000, height: 800 },
  },
  webServer: {
    command: 'bun run build:playground && bun scripts/serve-static.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
