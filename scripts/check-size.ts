import { readFileSync } from 'node:fs';

// gzip size budgets in bytes
const budgets: Array<[string, number]> = [
  ['dist/index.js', 2816],
  ['dist/index.cjs', 3328],
  ['dist/react.js', 4096],
  ['dist/react.cjs', 5120],
  ['dist/svelte.js', 4096],
  ['dist/svelte.cjs', 5120],
  ['dist/ferry.global.js', 4096],
];

let failed = false;
for (const [file, limit] of budgets) {
  const gz = Bun.gzipSync(readFileSync(file)).length;
  const ok = gz <= limit;
  console.log(`${ok ? '✅' : '❌'} ${file}: ${gz} B gzipped (limit ${limit} B)`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
