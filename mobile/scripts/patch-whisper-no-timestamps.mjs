// whisper.rn 0.7.4 exposes token timestamps, but not whisper.cpp's
// no_timestamps decoding switch. Fine-tuned Indic packs require the latter.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('node_modules/whisper.rn');
const edits = [
  [path.join(root,'cpp/jsi/RNWhisperJSI.cpp'),
    '    config.params.translate = getBoolProperty(runtime, options, "translate", false);',
    '    config.params.translate = getBoolProperty(runtime, options, "translate", false);\n    config.params.no_timestamps = getBoolProperty(runtime, options, "noTimestamps", false);'],
  [path.join(root,'src/NativeRNWhisper.ts'),
    '  /** Enable token-level timestamps */',
    '  /** Suppress timestamp tokens during decoding (recommended for Indic fine-tunes) */\n  noTimestamps?: boolean\n  /** Enable token-level timestamps */'],
  [path.join(root,'lib/typescript/NativeRNWhisper.d.ts'),
    '    /** Enable token-level timestamps */',
    '    /** Suppress timestamp tokens during decoding (recommended for Indic fine-tunes) */\n    noTimestamps?: boolean;\n    /** Enable token-level timestamps */'],
];
for (const [file,before,after] of edits) {
  const source = await readFile(file,'utf8');
  if (source.includes(after)) continue;
  if (!source.includes(before)) throw new Error(`whisper.rn changed; inspect ${file} before building`);
  await writeFile(file,source.replace(before,after));
}
console.log('whisper.rn noTimestamps option ready.');
