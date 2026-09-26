'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelAI, decodeRecording, runAI } from '@/lib/fieldproof/ai';
import { availableSpeechModel, bundledSpecialists, freshTranscript, speechCacheKey, type PresentationLanguage, type SpeechLanguage, type SpeechModel, type TranscriptDraft, type TranscriptResult } from '@/lib/fieldproof/transcription';
import { persistTranscript, readTranscript, savedTranscripts } from '@/lib/fieldproof/transcript-storage';
import { currentReview, meaningFlags } from '@/lib/fieldproof/meaning-check';
const message = (error: unknown) => error instanceof Error ? error.message : 'The action could not be completed.';

export function useTranscriber() {
  const [draft,setDraft] = useState<TranscriptDraft | null>(null); const current = useRef<TranscriptDraft | null>(null);
  const [history,setHistory] = useState<TranscriptDraft[]>([]); const [saved,setSaved] = useState('Opening local storage…');
  const [busy,setBusy] = useState(''); const [progress,setProgress] = useState(''); const [error,setError] = useState(''); const [notice,setNotice] = useState('');
  const [prepared,setPrepared] = useState({base:false,small:false,telugu:false,hindi:false,tamil:false,bengali:false,marathi:false}); const [recording,setRecording] = useState(false); const [seconds,setSeconds] = useState(0);
  const capture = useRef<MediaRecorder | null>(null); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const mounted = useRef(false); const sequence = useRef(0);
  const update = useCallback(async (next: TranscriptDraft, archive = false) => {
    current.current = next; if (mounted.current) { setDraft(next); setSaved('Saving on this device…'); }
    const revision = ++sequence.current;
    try { await persistTranscript(next,archive); if (mounted.current && revision === sequence.current) { setSaved('Saved on this device'); if (archive) setHistory(await savedTranscripts()); } return true; }
    catch (cause) { if (mounted.current) { setSaved('Not saved · export a copy'); setError(message(cause)); } return false; }
  },[]);
  useEffect(() => {
    let disposed = false; mounted.current = true;
    void (async () => {
      try { const existing = await readTranscript(); if (disposed) return; const next = existing ? {...existing,model:availableSpeechModel(existing.model),presentationLanguage:existing.presentationLanguage??'en',presentedText:existing.presentedText??''} : freshTranscript(); current.current = next; setDraft(next); setSaved(existing ? 'Transcript restored from this browser' : 'Saves automatically on this device'); setHistory(await savedTranscripts()); setPrepared({base:localStorage.getItem(speechCacheKey('base')) === 'yes',small:localStorage.getItem(speechCacheKey('small')) === 'yes',telugu:localStorage.getItem(speechCacheKey('telugu')) === 'yes',hindi:localStorage.getItem(speechCacheKey('hindi')) === 'yes',tamil:localStorage.getItem(speechCacheKey('tamil')) === 'yes',bengali:localStorage.getItem(speechCacheKey('bengali')) === 'yes',marathi:localStorage.getItem(speechCacheKey('marathi')) === 'yes'}); }
      catch(cause) { if (!disposed) setError(message(cause)); }
    })();
    return () => { disposed = true; mounted.current = false; if(timer.current) clearTimeout(timer.current); if(capture.current?.state === 'recording') capture.current.stop(); capture.current?.stream.getTracks().forEach(track=>track.stop()); cancelAI(); };
  },[]);
  useEffect(() => {
    if(!recording) return;
    const interval = setInterval(()=>setSeconds(value=>value+1),1000);
    const hide = () => { if(document.hidden && capture.current?.state === 'recording') capture.current.stop(); };
    document.addEventListener('visibilitychange',hide);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange',hide); };
  },[recording]);
  function patch(changes: Partial<TranscriptDraft>) { if(current.current) void update({...current.current,...changes,updatedAt:new Date().toISOString()}); }
  function confirmMeaning(flagId:string) {
    const snapshot=current.current;
    if(!snapshot || snapshot.presentationLanguage!=='en' || !snapshot.presentedText || !meaningFlags(snapshot.text,snapshot.presentedText).some(flag=>flag.id===flagId))return;
    const review=currentReview(snapshot.meaningReview,snapshot.text,snapshot.presentedText);
    if(review.checked[flagId])return;
    const at=new Date().toISOString();
    void update({...snapshot,meaningReview:{...review,checked:{...review.checked,[flagId]:at},events:[...review.events,{at,action:'checked' as const,flagId,sourceBefore:snapshot.text,englishBefore:snapshot.presentedText}].slice(-50)},updatedAt:at});
  }
  function correctMeaning(source:string,english:string,flagId?:string) {
    const snapshot=current.current;
    if(!snapshot || snapshot.presentationLanguage!=='en' || !source.trim() || !english.trim() || source.length>10000 || english.length>10000) {setError('Enter original and English text, each under 10,000 characters.');return;}
    if(source===snapshot.text && english===snapshot.presentedText)return;
    const prior=currentReview(snapshot.meaningReview,snapshot.text,snapshot.presentedText);
    const at=new Date().toISOString();
    void update({...snapshot,text:source,presentedText:english,chunks:source===snapshot.text?snapshot.chunks:[],meaningReview:{source,english,checked:{},events:[...prior.events,{at,action:'corrected' as const,flagId,sourceBefore:snapshot.text,englishBefore:snapshot.presentedText,sourceAfter:source,englishAfter:english}].slice(-50)},updatedAt:at});
    setNotice('Correction saved locally. Review the updated meaning checks.');
  }
  async function present(snapshot: TranscriptDraft, target: PresentationLanguage = snapshot.presentationLanguage ?? 'en', fromAudio = false) {
    const next = {...snapshot,presentationLanguage:target,presentedText:'',meaningReview:{source:snapshot.text,english:'',checked:{},events:snapshot.meaningReview?.events??[]},updatedAt:new Date().toISOString()};
    if(!await update(next) || target === 'original' || !snapshot.text.trim()) return;
    setBusy('translate'); setError(''); setProgress('Preparing the local presentation…');
    try {
      const translated = target === 'en' && fromAudio && snapshot.audio
        ? await runAI<string>('translate-english',{audio:await decodeRecording(snapshot.audio,121),speechModel:snapshot.model},setProgress)
        : await runAI<string>('translate-text',{text:snapshot.text,targetLanguage:target},setProgress);
      // A newer edit or language choice must never be overwritten by a late result.
      if(current.current?.id === next.id && current.current.text === next.text && current.current.presentationLanguage === target) {
        await update({...current.current,presentedText:translated,meaningReview:{source:next.text,english:translated,checked:{},events:current.current.meaningReview?.events??[]},updatedAt:new Date().toISOString()});
        setNotice(`Transcript ready in ${target === 'en' ? 'English' : target}. Review it against the original.`);
      }
    } catch(cause) { setError(`${message(cause)} Your original-language transcript is still saved.`); }
    finally { setBusy(''); setProgress(''); }
  }
  async function prepare(model: SpeechModel) {
    const modelName = model === 'telugu' ? 'Telugu specialist' : model === 'hindi' ? 'Hindi specialist' : model === 'tamil' ? 'Tamil specialist' : model === 'bengali' ? 'Bengali specialist' : model === 'marathi' ? 'Marathi specialist' : `Whisper ${model}`;
    setBusy('setup'); setError(''); setProgress(`Preparing ${modelName} on this device…`);
    try { await runAI('speech-setup',{speechModel:model},setProgress); localStorage.setItem(speechCacheKey(model),'yes'); setPrepared(value=>({...value,[model]:true})); setNotice(`${modelName} loaded. Test it offline before leaving connectivity.`); }
    catch(cause) { setError(message(cause)); }
    finally { setBusy(''); setProgress(''); }
  }
  async function transcribe(snapshot = current.current) {
    if(!snapshot?.audio) return;
    setBusy('transcribe'); setError(''); setNotice(''); setProgress('Decoding audio locally…');
    try {
      const audio = await decodeRecording(snapshot.audio,121);
      const model = availableSpeechModel(snapshot.language === 'auto' && ['telugu','hindi','tamil','bengali','marathi'].includes(snapshot.model) ? 'small' : snapshot.model);
      const result = await runAI<TranscriptResult>('transcribe-detailed',{audio,language:snapshot.language,speechModel:model},setProgress);
      const next = {...snapshot,model,text:result.text,original:result.text,chunks:result.chunks,meaningReview:{source:result.text,english:'',checked:{},events:snapshot.meaningReview?.events??[]},updatedAt:new Date().toISOString()};
      if (!await update(next)) return;
      localStorage.setItem(speechCacheKey(model),'yes');setPrepared(value=>({...value,[model]:true}));
      setBusy('');
      await present(next,next.presentationLanguage,true);
      if(next.presentationLanguage === 'original') setNotice('Transcription complete. Check names, numbers and mixed-language words against the recording.');
    } catch(cause) { setError(message(cause)); }
    finally { setBusy(''); setProgress(''); }
  }
  async function fresh() {
    if(current.current && (current.current.text || current.current.audio)) if (!await update(current.current,true)) return;
    if (!await update(freshTranscript())) return;
    setNotice('New transcript ready. Your previous session is in Saved.'); setError('');
  }
  async function importAudio(file: File) {
    setError(''); if(file.size > 25*1024*1024) { setError('Choose an audio file under 25 MB and two minutes.'); return; }
    if(!file.type.startsWith('audio/') && !/\.(wav|mp3|m4a|ogg|webm|flac)$/i.test(file.name)) { setError('Choose an audio file such as WAV, MP3, M4A, OGG or WebM.'); return; }
    setBusy('import');
    try {
      await decodeRecording(file,121);
      const settings = current.current && !current.current.text && !current.current.audio ? current.current : null;
      if(current.current && (current.current.text || current.current.audio)) if (!await update(current.current,true)) return;
      const next = {...freshTranscript(),language:settings?.language??'auto',model:settings?.model??'small',presentationLanguage:settings?.presentationLanguage??'en',audio:file};
      if (!await update(next)) return; setBusy(''); await transcribe(next);
    } catch(cause) { setError(message(cause)); } finally { setBusy(''); }
  }
  async function start() {
    if(capture.current?.state === 'recording') { capture.current.stop(); return; }
    if(!current.current) return; setBusy('microphone'); setError(''); setNotice('');
    try {
      if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording needs a supported browser over HTTPS or localhost. You can upload audio or type instead.');
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      if(!mounted.current) { stream.getTracks().forEach(track=>track.stop()); return; }
      let recorder: MediaRecorder;
      try { recorder = new MediaRecorder(stream); } catch(cause) { stream.getTracks().forEach(track=>track.stop()); throw cause; }
      const settings = !current.current.text && !current.current.audio ? current.current : null;
      if(current.current.text || current.current.audio) if (!await update(current.current,true)) { stream.getTracks().forEach(track=>track.stop()); return; }
      const next = {...freshTranscript(),language:settings?.language??'auto',model:settings?.model??'small',presentationLanguage:settings?.presentationLanguage??'en'};
      if (!await update(next) || !mounted.current) { stream.getTracks().forEach(track=>track.stop()); return; }
      const chunks: BlobPart[] = []; capture.current = recorder;
      recorder.ondataavailable = event => { if(event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track=>track.stop()); if(timer.current) clearTimeout(timer.current);
        const audio = new Blob(chunks,{type:recorder.mimeType}); const nextDraft = {...next,audio,updatedAt:new Date().toISOString()};
        if(mounted.current) { setRecording(false); void update(nextDraft).then(saved=>{if(saved && mounted.current) void transcribe(nextDraft);}); }
        else void persistTranscript(nextDraft);
      };
      recorder.onerror = () => { if(recorder.state === 'recording') recorder.stop(); setError('Recording was interrupted. Check the saved audio and try again.'); };
      recorder.start(); setSeconds(0); setRecording(true); timer.current = setTimeout(()=>{if(recorder.state === 'recording') recorder.stop();},120000);
    } catch(cause) { setError(message(cause)); } finally { setBusy(''); }
  }
  async function open(item: TranscriptDraft) { if(current.current && (current.current.text || current.current.audio)) if (!await update(current.current,true)) return; if (!await update({...item,presentationLanguage:item.presentationLanguage??'en',presentedText:item.presentedText??''})) return; setNotice('Saved transcript opened.'); }
  return {draft,history,saved,busy,progress,error,notice,prepared,recording,seconds,locked:Boolean(busy)||recording,patch,prepare,transcribe,start,fresh,importAudio,open,setError,setNotice,confirmMeaning,correctMeaning,present:(target:PresentationLanguage)=>{if(current.current)void present(current.current,target,false);},refreshPresentation:()=>{if(current.current)void present(current.current,current.current.presentationLanguage,false);},editText:(text:string)=>patch({text,presentedText:'',chunks:[],meaningReview:{source:text,english:'',checked:{},events:current.current?.meaningReview?.events??[]}}),save:async()=>{if(current.current) {if (!await update(current.current,true)) return; setNotice('Session added to Saved on this device.');}},chooseLanguage:(language:SpeechLanguage)=>patch({language,model:bundledSpecialists ? language === 'te' ? 'telugu' : language === 'hi' ? 'hindi' : language === 'ta' ? 'tamil' : language === 'bn' ? 'bengali' : language === 'mr' ? 'marathi' : ['telugu','hindi','tamil','bengali','marathi'].includes(current.current?.model??'') ? 'small' : current.current?.model ?? 'small' : availableSpeechModel(current.current?.model??'small')}),chooseModel:(model:SpeechModel)=>patch({model:availableSpeechModel(model)})};
}
