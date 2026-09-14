import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['src/category-petals.ts'],
  outfile: 'js/category-petals.js',
  bundle: true,
  minify: true,
  format: 'iife',
});
console.log('Built flower petal animation.');
