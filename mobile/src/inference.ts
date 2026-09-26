import { initLlama } from 'llama.rn';
import { initWhisper } from 'whisper.rn/index';
import { hasModel, modelPath } from './models';
import type { ModelKind } from './models';
import type { SpeechLanguage } from './speech-languages';
import type { TimedPhrase } from './meaning-check';

export type TargetLanguage = Exclude<SpeechLanguage, 'auto'> | 'original';

// One inference context at a time across speech and translation.
let active = false;

export async function transcribeAudioDetailed(uri: string, language: SpeechLanguage = 'auto'): Promise<{text:string; detectedLanguage:string; segments:TimedPhrase[]}> {
  if (active) throw new Error('An on-device task is already running.');
  active = true;
  try {
    const specialized: Partial<Record<SpeechLanguage, ModelKind>> = { te: 'speechTelugu', hi: 'speechHindi', ta: 'speechTamil', bn: 'speechBengali', mr: 'speechMarathi' };
    const optional = specialized[language];
    const specialist = Boolean(optional && await hasModel(optional));
    const selected: ModelKind = specialist && optional ? optional : 'speech';
    if (!await hasModel(selected)) throw new Error('Install the speech model in Setup. The recording remains on your phone.');
    const context = await initWhisper({ filePath: modelPath(selected), useGpu: false });
    try {
      const task = context.transcribe(uri, { language, translate: false, maxThreads: 2, noTimestamps: true });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; void task.stop().catch(() => undefined); }, 120_000);
      try {
        const result = await task.promise;
        if (timedOut || result.isAborted) throw new Error('Transcription stopped. Your recording is saved; retry or type your transcript.');
        if (!result.result.trim()) throw new Error('No clear speech found. Try again or type your transcript.');
        return { text: result.result.trim(), detectedLanguage: result.language || language,
          // whisper.cpp segment times use 10 ms ticks. No-timestamp specialist
          // output may have no usable span; the UI then replays the full audio.
          segments:result.segments.filter(segment=>segment.t1>segment.t0).map(segment=>({text:segment.text,start:segment.t0/100,end:segment.t1/100})) };
      } finally { clearTimeout(timer); }
    } finally { await context.release(); }
  } finally { active = false; }
}

export async function translateAudioToEnglish(uri: string): Promise<string> {
  if (active) throw new Error('An on-device task is already running.');
  active = true;
  try {
    if (!await hasModel('speech')) throw new Error('Install multilingual Whisper in Setup for English presentation.');
    const context = await initWhisper({filePath:modelPath('speech'),useGpu:false});
    try {
      const task = context.transcribe(uri,{language:'auto',translate:true,maxThreads:2,noTimestamps:true});
      const timer = setTimeout(() => {void task.stop().catch(()=>undefined);},120_000);
      try {
        const result = await task.promise;
        if(result.isAborted || !result.result.trim()) throw new Error('English presentation could not be produced. The original is saved.');
        return result.result.trim();
      } finally {clearTimeout(timer);}
    } finally {await context.release();}
  } finally {active=false;}
}

export async function translateText(text:string,target:Exclude<TargetLanguage,'original'>):Promise<string> {
  if(active) throw new Error('An on-device task is already running.');
  if(!text.trim() || text.length>5000) throw new Error('Choose up to 5,000 characters to translate.');
  active=true;
  try {
    if(!await hasModel('language')) throw new Error('Install Qwen in Setup to present text in this language.');
    const context=await initLlama({model:modelPath('language'),n_ctx:4096,n_batch:128,n_threads:2,n_gpu_layers:0,use_mlock:false});
    const names:Record<Exclude<TargetLanguage,'original'>,string>={en:'English',hi:'Hindi',bn:'Bengali',mr:'Marathi',te:'Telugu',ta:'Tamil',zh:'Mandarin Chinese',es:'Spanish',ar:'Arabic',fr:'French'};
    const schema={type:'object',properties:{translation:{type:'string'}},required:['translation'],additionalProperties:false};
    try {
      const task=context.completion({messages:[{role:'system',content:`Translate the user's transcript into ${names[target]}. Preserve names, numbers, negation and meaning. Do not invent missing words. Return only JSON with a translation key.`},{role:'user',content:text}],enable_thinking:false,temperature:0,n_predict:2048,response_format:{type:'json_schema',json_schema:{strict:true,schema}}});
      const timer=setTimeout(()=>{void context.stopCompletion().catch(()=>undefined);},120_000);
      try {
        const result=await task;
        const translated=JSON.parse(result.text.replace(/^\s*<think>\s*<\/think>\s*/, '')).translation;
        if(typeof translated!=='string' || !translated.trim()) throw new Error('The local model returned no translation.');
        return translated.trim();
      } finally {clearTimeout(timer);}
    } finally {await context.release();}
  } finally {active=false;}
}
