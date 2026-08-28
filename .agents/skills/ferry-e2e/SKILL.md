---
name: ferry-e2e
description: Use this skill when adding or running REAL-BROWSER tests in the ferry repo (Playwright). Covers the chromium-only project, the zero-dependency static server (scripts/serve-static.mjs), clipboard permission grants, and how to verify ferry against a genuine Clipboard API. Trigger on e2e or browser-test work.
---

# Ferry E2E — real-browser testing

Unit tests run on happy-dom and cannot prove real Clipboard API behavior.
E2E specs drive the actual playground page in Chromium.

## Run

```bash
bunx playwright install chromium   # once per machine / CI step
bun run test:e2e                  # starts static server + runs specs
```

## Architecture

- `playwright.config.ts` — chromium project only; `webServer` builds the CDN
  bundle (`bun run build:cdn`) then starts `scripts/serve-static.mjs` on
  port 4173 with `reuseExistingServer` outside CI.
- `scripts/serve-static.mjs` — zero-dependency static server; maps
  `/ferry.global.js` to `dist/ferry.global.js`; path-traversal guarded.
- Specs live in `test/e2e/*.spec.ts` and drive `playground/index.html`.

## Clipboard specifics

- Grant permissions per test origin before navigation:
  `context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' })`
- `127.0.0.1` is a secure context, so the async Clipboard API works.
- Verify writes via `page.evaluate(() => navigator.clipboard.readText())`.
- Verify rich slots via `navigator.clipboard.read()[0].getType(...)`.
- Playwright is a Node runner invoked via `bunx playwright test`; the E2E
  workflow (`e2e.yml`) sets up Node 20 for it, bun does the install/build.

## Rules

- Keep the suite deterministic: no external URLs, no timing sleeps — use
  expect polling.
- Chromium-only by default; adding firefox/webkit projects requires
  installing their binaries in `e2e.yml` too.
- Any new playground section should get a matching spec.
