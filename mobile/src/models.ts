import * as FS from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import { sha256 } from '@noble/hashes/sha256';

export const modelCatalog = {
  language: {
    name: 'Qwen3 1.7B · Q4_K_M', filename: 'qwen3-1.7b-q4_k_m.gguf', bytes: 1282439584,
    sha256: '72c5c3cb38fa32d5256e2fe30d03e7a64c6c79e668ad84057e3bd66e250b24fb',
    url: 'https://huggingface.co/bartowski/Qwen_Qwen3-1.7B-GGUF/resolve/main/Qwen_Qwen3-1.7B-Q4_K_M.gguf',
  },
  speech: {
    name: 'Whisper small · multilingual Q5_1', filename: 'whisper-small-q5_1.bin', bytes: 190085487,
    sha256: 'ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin',
  },
  speechTelugu: {
    name: 'Telugu specialist · optional Q5_1', filename: 'whisper-telugu-small-q5_1.bin', bytes: 190085487,
    sha256: '47369abd7ee13b624606b762a860a42d7cbea8f320e3c4553954d1fea748d49e',
    url: 'https://huggingface.co/bhaskaro/ainotes-whisper-telugu-q5_1/resolve/main/ggml-model.bin',
  },
  speechHindi: {
    name: 'Hindi specialist · optional Q5_1', filename: 'whisper-hindi-small-q5_1.bin', bytes: 190085487,
    sha256: '6813fed7ffa6c3fa14490c1f1788d2d8b6e3b7badf59a2f75fb4c5c21cf00f3f',
    url: 'https://huggingface.co/ukta-app/indic-whisper-ggml/resolve/main/ggml-hi-small.bin',
  },
  speechTamil: {
    name: 'Tamil specialist · optional Q5_1', filename: 'whisper-tamil-small-q5_1.bin', bytes: 190085487,
    sha256: '227e8a3b257de6e49a62c736708f89812573b6a39142f831cb9e7815a57dbfa2',
    url: 'https://huggingface.co/ukta-app/indic-whisper-ggml/resolve/main/ggml-ta-small.bin',
  },
  speechBengali: {
    name: 'Bengali specialist · optional Q5_1', filename: 'whisper-bengali-small-q5_1.bin', bytes: 190085487,
    sha256: 'a5a806b5832c18d0763d897ba01b1c3679910876417b4f7f2e3818d8eed85bde',
    url: 'https://huggingface.co/bhaskaro/ainotes-whisper-bengali-q5_1/resolve/main/ggml-model.bin',
  },
  speechMarathi: {
    name: 'Marathi specialist · optional Q5_1', filename: 'whisper-marathi-small-q5_1.bin', bytes: 190085487,
    sha256: '13a21ed4cbe0e95680f2e8d172ff14f8b5a23d630429d9f24dd2e5e548301743',
    url: 'https://huggingface.co/bhaskaro/ainotes-whisper-marathi-q5_1/resolve/main/ggml-model.bin',
  },
} as const;
export type ModelKind = keyof typeof modelCatalog;
export function modelPath(kind: ModelKind) { return `${FS.documentDirectory}models/${modelCatalog[kind].filename}`; }
export async function hasModel(kind: ModelKind) {
  const info = await FS.getInfoAsync(modelPath(kind));
  return info.exists && info.size === modelCatalog[kind].bytes;
}
let installing = false;
export async function installModel(kind: ModelKind, onProgress: (message: string) => void) {
  if (installing) throw new Error('Finish the current model download first.');
  installing = true;
  const entry = modelCatalog[kind];
  const temporary = `${modelPath(kind)}.partial`;
  try {
    await FS.makeDirectoryAsync(`${FS.documentDirectory}models`, { intermediates: true });
    await FS.deleteAsync(temporary, { idempotent: true });
    if (await FS.getFreeDiskStorageAsync() < entry.bytes + 256 * 1024 * 1024) {
      throw new Error('Not enough free storage. Make room for this model plus 256 MB, then retry.');
    }
    const download = FS.createDownloadResumable(entry.url, temporary, {}, event => onProgress(`Downloading ${Math.min(100, Math.round(event.totalBytesWritten / entry.bytes * 100))}%`));
    const result = await download.downloadAsync();
    if (!result || result.status !== 200) throw new Error('Download interrupted. Retry when connected.');
    const info = await FS.getInfoAsync(temporary);
    if (!info.exists || info.size !== entry.bytes) throw new Error('Incomplete model download. Please retry.');
    const file = new File(temporary).open();
    const hash = sha256.create();
    try {
      for (let offset = 0; offset < entry.bytes; offset += 1024 * 1024) {
        hash.update(file.readBytes(Math.min(1024 * 1024, entry.bytes - offset)));
        if (offset % (8 * 1024 * 1024) === 0) {
          onProgress(`Checking file ${Math.round(offset / entry.bytes * 100)}%`);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } finally { file.close(); }
    const digest = Array.from(hash.digest(), byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== entry.sha256) throw new Error('Model integrity check failed. Please download again.');
    await FS.moveAsync({ from: temporary, to: modelPath(kind) });
    onProgress('Installed and verified. Ready offline.');
  } finally {
    installing = false;
    await FS.deleteAsync(temporary, { idempotent: true });
  }
}
