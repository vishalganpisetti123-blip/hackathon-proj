import { parseBrowserTranslation } from './model-output';
import type { MLCEngine } from '@mlc-ai/web-llm';
import type { AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import { languageOptions, type PresentationLanguage, type SpeechLanguage, type SpeechModel, type TranscriptResult } from './transcription';

const model = 'Qwen3-1.7B-q4f16_1-MLC';
let engine: MLCEngine | null = null;
let speech: AutomaticSpeechRecognitionPipeline | null = null;
let loadedSpeechModel: SpeechModel | null = null;
let busy = false;
const progress = (text: string) => self.postMessage({ type: 'progress', text });

async function loadLanguage() {
  if (speech) { await speech.dispose(); speech = null; }
  if (engine) return engine;
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  engine = await CreateMLCEngine(model, { initProgressCallback: report => progress(report.text), appConfig: undefined });
  return engine;
}
async function loadSpeech(selected: SpeechModel = 'base') {
  if (engine) { await engine.unload(); engine = null; }
  if (speech && loadedSpeechModel === selected) return speech;
  if (speech) { await speech.dispose(); speech = null; }
  const { pipeline, env } = await import('@huggingface/transformers');
  const specialist = selected === 'telugu' || selected === 'hindi' || selected === 'tamil' || selected === 'bengali' || selected === 'marathi';
  env.allowLocalModels = specialist;
  env.allowRemoteModels = !specialist;
  env.localModelPath = '/models/';
  env.useBrowserCache = true;
  if (!env.backends.onnx.wasm) throw new Error('The speech runtime is unavailable in this browser.');
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.wasmPaths = '/wasm/';
  // Multilingual model, never the English-only .en variant.
  speech = await pipeline<'automatic-speech-recognition'>('automatic-speech-recognition', specialist ? `fieldproof/whisper-${selected}-small` : `Xenova/whisper-${selected}`, {
    device: 'wasm', dtype: 'q8',
    progress_callback: event => { if ('progress' in event) progress(`Speech model · ${Math.round(event.progress)}% of ${event.file}`); },
  });
  loadedSpeechModel = selected;
  return speech;
}
self.onmessage = async (event: MessageEvent<{ id: number; action: string; text?: string; audio?: Float32Array; language?: SpeechLanguage; speechModel?: SpeechModel; targetLanguage?: PresentationLanguage }>) => {
  const { id, action, text, audio, language = 'auto', speechModel = 'base', targetLanguage } = event.data;
  if (busy) { self.postMessage({ id, error: 'A local AI task is already running.' }); return; }
  busy = true;
  try {
    if (action === 'language-setup') { await loadLanguage(); self.postMessage({ id, result: true }); }
    else if (action === 'speech-setup') { await loadSpeech(speechModel); self.postMessage({ id, result: true }); }
    else if (action === 'translate-text') {
      if (!text?.trim() || text.length > 10000 || !targetLanguage || targetLanguage === 'original') throw new Error('Choose a target language and up to 10,000 characters.');
      const local = await loadLanguage();
      const target = languageOptions.find(option => option.value === targetLanguage)?.label ?? targetLanguage;
      progress(`Presenting in ${target} on this device…`);
      const result = await local.chat.completions.create({
        messages: [{role:'system',content:`Translate the user's transcript into ${target}. Preserve names, numbers, negation and meaning. Do not add explanations or missing words. Return only a JSON object with one key, translation.`},{role:'user',content:text}],
        temperature:0,max_tokens:2048,response_format:{type:'json_object',schema:JSON.stringify({type:'object',properties:{translation:{type:'string'}},required:['translation'],additionalProperties:false})},extra_body:{enable_thinking:false},
      });
      if(result.choices[0]?.finish_reason === 'length') throw new Error('Translation was too long. Try a shorter transcript.');
      const translated = parseBrowserTranslation(result.choices[0]?.message.content ?? '');
      self.postMessage({id,result:translated});
    } else if (action === 'translate-english') {
      if (!audio?.length || audio.length > 16000 * 121) throw new Error('Choose audio up to two minutes.');
      const local = await loadSpeech(speechModel === 'base' ? 'base' : 'small');
      progress('Presenting in English from the recording on this device…');
      const result = await local(audio,{task:'translate',chunk_length_s:20,stride_length_s:3,return_timestamps:false});
      const output = Array.isArray(result) ? result[0] : result;
      if(!output?.text?.trim()) throw new Error('English presentation could not be produced. Your original transcript is saved.');
      self.postMessage({id,result:output.text.trim()});
    } else if (action === 'transcribe' || action === 'transcribe-detailed') {
      const detailed = action === 'transcribe-detailed';
      if (!audio || !audio.length || audio.length > 16000 * (detailed ? 121 : 21)) throw new Error('Choose audio up to two minutes.');
      if ((speechModel === 'telugu' && language !== 'te') || (speechModel === 'hindi' && language !== 'hi') || (speechModel === 'tamil' && language !== 'ta') || (speechModel === 'bengali' && language !== 'bn') || (speechModel === 'marathi' && language !== 'mr')) throw new Error('The selected specialist requires its matching spoken language. Choose Whisper small for other or mixed speech.');
      const local = await loadSpeech(speechModel);
      progress('Transcribing locally. Your recording is not uploaded.');
      const languages = { en: 'english', hi: 'hindi', te: 'telugu', bn: 'bengali', mr: 'marathi', ta: 'tamil', zh: 'chinese', es: 'spanish', ar: 'arabic', fr: 'french' };
      // Locally exported Indic checkpoints lack cross-attention outputs
      // required for word timestamps; keep its text rather than failing the take.
      const result = await local(audio, { task: 'transcribe', ...(language !== 'auto' ? { language: languages[language] } : {}), chunk_length_s: 20, stride_length_s: 3, return_timestamps: detailed && !['telugu','hindi','tamil','bengali','marathi'].includes(speechModel) ? 'word' : false });
      const output = Array.isArray(result) ? result[0] : result;
      const transcript = output?.text?.trim();
      if (!transcript) throw new Error('No clear speech found. Try again or type the transcript.');
      const detailedResult: TranscriptResult = { text: transcript, chunks: output.chunks ?? [], language, model: speechModel };
      self.postMessage({ id, result: detailed ? detailedResult : transcript });
    } else throw new Error('Unknown AI operation.');
  } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'Local AI could not complete this task.' }); }
  finally { busy = false; }
};
