import { mkdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const runtime = path.dirname(require.resolve('onnxruntime-web'));
await mkdir('public/wasm', { recursive: true });
for (const name of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  await copyFile(path.join(runtime, name), path.join('public/wasm', name));
}
console.log('Local speech runtime copied for offline use.');
