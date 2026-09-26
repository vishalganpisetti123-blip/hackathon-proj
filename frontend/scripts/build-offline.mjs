import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
// Large speech weights are explicitly prepared on demand by Transformers.js.
// Installing the page shell must stay fast and must not duplicate a 414 MB model.
const assets = (await files('out')).filter(file => !file.endsWith('.map') && !file.endsWith('/sw.js') && !(file.includes('/models/fieldproof/whisper-') && file.includes('/onnx/'))).sort();
const hash = createHash('sha256');
for (const file of assets) hash.update(await readFile(file));
const version = hash.digest('hex').slice(0, 16);
const urls = assets.map(file => '/' + path.relative('out', file).split(path.sep).join('/'));
await writeFile('out/sw.js', `/* Generated from the production export. Model caches are managed separately. */
const CACHE = 'fieldproof-shell-${version}';
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    // Limit concurrency on slower connections; installation is all-or-nothing.
    for (let i = 0; i < ASSETS.length; i += 8) await cache.addAll(ASSETS.slice(i, i + 8));
    await self.skipWaiting();
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('fieldproof-shell-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const file = event.request.mode === 'navigate' ? (url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname.includes('.') ? url.pathname : url.pathname + '/index.html') : url.pathname;
    const cached = await cache.match(file);
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch { return new Response('This page is unavailable offline. Reopen /transcribe/ to use the prepared speech studio.', { status: 503, headers: { 'Content-Type': 'text/plain' } }); }
  })());
});
`);
console.log(`Offline shell ${version}: ${urls.length} local assets.`);
