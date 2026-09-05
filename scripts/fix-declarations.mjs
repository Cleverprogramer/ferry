import { readFileSync, writeFileSync } from 'node:fs';

// Node16 ESM resolution requires explicit extensions in emitted declarations.
// tsc rewrites nothing, so map "./index" -> "./index.js" in the framework subpaths.
for (const file of [
  'dist/react.d.ts',
  'dist/react.d.cts',
  'dist/vue.d.ts',
  'dist/vue.d.cts',
  'dist/svelte.d.ts',
  'dist/svelte.d.cts',
]) {
  const source = readFileSync(file, 'utf8');
  writeFileSync(file, source.replaceAll(`from './index'`, `from './index.js'`));
}
console.log('declaration specifiers fixed');
