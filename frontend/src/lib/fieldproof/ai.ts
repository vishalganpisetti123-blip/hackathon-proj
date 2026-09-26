import type { PresentationLanguage, SpeechLanguage, SpeechModel } from './transcription';
let worker: Worker | null = null;
let nextId = 0;
let pending: { id: number; resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>; progress: (text: string) => void } | null = null;
function startWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = event => {
    if (!pending) return;
    if (event.data.type === 'progress') { pending.progress(event.data.text); return; }
    if (event.data.id !== pending.id) return;
    const task = pending; pending = null; clearTimeout(task.timer);
    if (event.data.error) task.reject(new Error(event.data.error)); else task.resolve(event.data.result);
  };
  worker.onerror = () => cancelAI('The browser AI worker stopped. Your draft is saved; try again or use your original words.');
  return worker;
}
export function cancelAI(message = 'Local AI stopped. Your draft is still saved.') {
  worker?.terminate(); worker = null;
  if (pending) { clearTimeout(pending.timer); pending.reject(new Error(message)); pending = null; }
}
export function runAI<T = unknown>(action: string, data: { text?: string; audio?: Float32Array; language?: SpeechLanguage; speechModel?: SpeechModel; targetLanguage?: PresentationLanguage }, progress: (text: string) => void): Promise<T> {
  if (pending) return Promise.reject(new Error('Wait for the current AI task.'));
  const instance = startWorker();
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending = { id, resolve: value => resolve(value as T), reject, progress, timer: setTimeout(() => cancelAI('Local AI took too long. Your recording and original words are saved; retry after the model is prepared.'), 20 * 60_000) };
    instance.postMessage({ id, action, ...data });
  });
}
export async function decodeRecording(blob: Blob, maxSeconds = 21): Promise<Float32Array> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > maxSeconds) throw new Error(`Choose audio up to ${maxSeconds} seconds. Longer files are not silently truncated.`);
    const frames = Math.ceil(decoded.duration * 16000);
    if (!frames) throw new Error('This recording is empty.');
    const offline = new OfflineAudioContext(1, frames, 16000);
    const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
    return (await offline.startRendering()).getChannelData(0);
  } finally { await context.close(); }
}
