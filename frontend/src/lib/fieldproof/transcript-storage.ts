import type { TranscriptDraft } from './transcription';
let database: Promise<IDBDatabase> | undefined;
function db() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('fieldproof-transcripts', 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('draft'); request.result.createObjectStore('saved', { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(new Error('Local transcript storage is unavailable. Export text before leaving.')); };
  }); return database;
}
export async function readTranscript(): Promise<TranscriptDraft | undefined> {
  const tx = (await db()).transaction('draft'); return new Promise((resolve, reject) => { const request = tx.objectStore('draft').get('active'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}
export async function persistTranscript(draft: TranscriptDraft, archive = false) {
  const tx = (await db()).transaction(['draft','saved'], 'readwrite');
  tx.objectStore('draft').put(draft, 'active'); if (archive) tx.objectStore('saved').put(draft);
  return new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error('Transcript could not be saved. Export a copy and check browser storage.')); });
}
export async function savedTranscripts(): Promise<TranscriptDraft[]> {
  const tx = (await db()).transaction('saved'); return new Promise((resolve, reject) => { const request = tx.objectStore('saved').getAll(); request.onsuccess = () => resolve((request.result as TranscriptDraft[]).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))); request.onerror = () => reject(request.error); });
}
