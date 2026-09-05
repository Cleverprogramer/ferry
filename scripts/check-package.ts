/**
 * Publish gate: asserts the npm tarball contains EXACTLY the artifacts we
 * intend to ship — every runtime bundle, every declaration file, README,
 * LICENSE — and nothing else (no src, tests, playground, or intermediates).
 *
 * Run via `bun scripts/check-package.ts` (also wired into prepublishOnly).
 */
const EXPECTED = [
  'LICENSE',
  'README.md',
  'package.json',
  'dist/ferry.global.js',
  'dist/index.cjs',
  'dist/index.d.cts',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/react.cjs',
  'dist/react.d.cts',
  'dist/react.d.ts',
  'dist/react.js',
  'dist/svelte.cjs',
  'dist/svelte.d.cts',
  'dist/svelte.d.ts',
  'dist/svelte.js',
  'dist/vue.cjs',
  'dist/vue.d.cts',
  'dist/vue.d.ts',
  'dist/vue.js',
].sort();

const proc = Bun.spawnSync(['npm', 'pack', '--dry-run', '--json'], {
  stdout: 'pipe',
  stderr: 'pipe',
});
if (proc.exitCode !== 0) {
  console.error(new TextDecoder().decode(proc.stderr));
  process.exit(1);
}

const packed = JSON.parse(new TextDecoder().decode(proc.stdout))[0] as {
  files: Array<{ path: string }>;
};
const actual = packed.files.map((f) => f.path).sort();

const missing = EXPECTED.filter((f) => !actual.includes(f));
const extra = actual.filter((f) => !EXPECTED.includes(f));

if (missing.length || extra.length) {
  if (missing.length) console.error(`missing from tarball: ${missing.join(', ')}`);
  if (extra.length) console.error(`unexpected in tarball: ${extra.join(', ')}`);
  process.exit(1);
}

console.log(`package contents verified: ${actual.length} files, exactly as intended`);
