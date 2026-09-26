import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { transcribeAudioDetailed, translateAudioToEnglish, translateText } from './inference';
import type { TargetLanguage } from './inference';
import { startRecording } from './recorder';
import { loadTranscript, recentTranscripts, saveTranscript } from './store';
import type { SavedTranscript } from './store';
import { speechLanguages } from './speech-languages';
import { Button, colors, Input, styles } from './ui';
import { MeaningCheck } from './MeaningCheck';
import { currentReview, meaningFlags } from './meaning-check';

function fresh(language: SavedTranscript['language'] = 'auto'): SavedTranscript {
  const now = new Date().toISOString();
  return { id: Crypto.randomUUID(), createdAt: now, updatedAt: now, text: '', original: '', audioUri: null, language, presentationLanguage:'en', presentedText:'' };
}
function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'The action failed. Your saved transcript is still on this phone.';
}

export function Transcriber({ setBusy, onError }: { setBusy: (value: string) => void; onError: (message: string) => void }) {
  const [draft, setDraft] = useState<SavedTranscript | null>(null);
  const current = useRef<SavedTranscript | null>(null);
  const [history, setHistory] = useState<SavedTranscript[]>([]);
  const [working, setWorking] = useState('');
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState('');
  const stopRecording = useRef<null | (() => Promise<string>)>(null);
  const mounted = useRef(true);
  const revision = useRef(0);

  const persist = useCallback(async (next: SavedTranscript) => {
    const token = ++revision.current;
    current.current = next;
    if (mounted.current) setDraft(next);
    await saveTranscript(next);
    if (mounted.current && token === revision.current) setHistory(await recentTranscripts());
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadTranscript().then(async saved => {
      if (!mounted.current) return;
      const next = saved ? {...saved,presentationLanguage:saved.presentationLanguage??'en',presentedText:saved.presentedText??''} : fresh();
      current.current = next;
      setDraft(next);
      setHistory(await recentTranscripts());
    }).catch(error => onError(errorText(error)));
    return () => { mounted.current = false; };
  }, [onError]);

  const transcribeSnapshot = useCallback(async (snapshot:SavedTranscript) => {
    if(!snapshot.audioUri)return;
    setWorking('Detecting language and transcribing on this phone…');setBusy('Transcribing on this phone…');
    try {
      const result=await transcribeAudioDetailed(snapshot.audioUri,snapshot.language);
      let next:SavedTranscript={...snapshot,text:result.text,original:result.text,detectedLanguage:result.detectedLanguage,segments:result.segments,presentedText:'',meaningReview:{source:result.text,english:'',checked:{},events:snapshot.meaningReview?.events??[]},updatedAt:new Date().toISOString()};
      await persist(next);
      if(next.presentationLanguage==='original')setNotice('Transcript ready. Review names and numbers against the audio.');
      else {
        setWorking(`Presenting in ${next.presentationLanguage} on this phone…`);
        const presented=next.presentationLanguage==='en' && result.detectedLanguage==='en' ? result.text
          : next.presentationLanguage==='en' ? await translateAudioToEnglish(snapshot.audioUri)
          : await translateText(result.text,next.presentationLanguage);
        if(current.current?.id===next.id && current.current.text===next.text && current.current.presentationLanguage===next.presentationLanguage){
          next={...current.current,presentedText:presented,meaningReview:{source:next.text,english:presented,checked:{},events:current.current.meaningReview?.events??[]},updatedAt:new Date().toISOString()};await persist(next);
          setNotice(`Transcript ready in ${next.presentationLanguage}. Review against the original.`);
        }
      }
    }catch(error){onError(`${errorText(error)} The recording and any original words remain saved.`);}
    finally{if(mounted.current){setWorking('');setBusy('');}}
  },[onError,persist,setBusy]);

  const finish = useCallback(async () => {
    const stop = stopRecording.current;
    if (!stop) return;
    stopRecording.current = null;
    setRecording(false);
    setWorking('Saving audio…');
    setBusy('Saving audio…');
    try {
      const audioUri = await stop();
      const latest = current.current;
      if (!latest) throw new Error('Transcript storage is not ready.');
      const saved={ ...latest, audioUri, text: '', original: '', presentedText:'',segments:[],meaningReview:undefined,updatedAt: new Date().toISOString() };
      await persist(saved);
      if(mounted.current && AppState.currentState==='active') await transcribeSnapshot(saved);
      else if(mounted.current)setNotice('Audio saved. Transcribe it when the app is active.');
    } catch (error) { onError(errorText(error)); }
    finally { if (mounted.current) { setWorking(''); setBusy(''); } }
  }, [onError, persist, setBusy, transcribeSnapshot]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') void finish(); });
    return () => { listener.remove(); void finish(); };
  }, [finish]);

  async function start() {
    if (!current.current || working || recording) return;
    setNotice('');
    setWorking('Opening microphone…');
    setBusy('Opening microphone…');
    try {
      if (current.current.text || current.current.audioUri) {
        await persist(fresh());
      }
      stopRecording.current = await startRecording(() => { void finish(); });
      setRecording(true);
      setWorking('Recording…');
      setBusy('Recording…');
    } catch (error) {
      onError(errorText(error));
      setWorking(''); setBusy('');
    }
  }

  async function transcribe() {if(current.current?.audioUri&&!working)await transcribeSnapshot(current.current);}

  async function choosePresentation(language:TargetLanguage) {
    const snapshot=current.current;if(!snapshot || working)return;
    const next={...snapshot,presentationLanguage:language,presentedText:'',meaningReview:{source:snapshot.text,english:'',checked:{},events:snapshot.meaningReview?.events??[]},updatedAt:new Date().toISOString()};await persist(next);
    if(language==='original'||!next.text.trim())return;
    setWorking(`Presenting in ${language} on this phone…`);setBusy('Translating on this phone…');
    try{
      const presented=language==='en'&&next.audioUri&&next.text===next.original ? next.detectedLanguage==='en'?next.text:await translateAudioToEnglish(next.audioUri):await translateText(next.text,language);
      if(current.current?.id===next.id&&current.current.text===next.text&&current.current.presentationLanguage===language)await persist({...current.current,presentedText:presented,meaningReview:{source:next.text,english:presented,checked:{},events:current.current.meaningReview?.events??[]},updatedAt:new Date().toISOString()});
    }catch(error){onError(`${errorText(error)} Original words remain available.`);}
    finally{setWorking('');setBusy('');}
  }

  function edit(text: string) {
    const snapshot = current.current;
    if (!snapshot) return;
    void persist({ ...snapshot, text, presentedText:'',segments:[],meaningReview:{source:text,english:'',checked:{},events:snapshot.meaningReview?.events??[]},updatedAt: new Date().toISOString() }).catch(error => onError(errorText(error)));
  }

  function confirmMeaning(flagId:string) {
    const snapshot=current.current;
    if(!snapshot||snapshot.presentationLanguage!=='en'||!snapshot.presentedText||!meaningFlags(snapshot.text,snapshot.presentedText).some(flag=>flag.id===flagId))return;
    const review=currentReview(snapshot.meaningReview,snapshot.text,snapshot.presentedText);
    if(review.checked[flagId])return;
    const at=new Date().toISOString();
    void persist({...snapshot,meaningReview:{...review,checked:{...review.checked,[flagId]:at},events:[...review.events,{at,action:'checked' as const,flagId,sourceBefore:snapshot.text,englishBefore:snapshot.presentedText}].slice(-50)},updatedAt:at}).catch(error=>onError(errorText(error)));
  }

  function correctMeaning(source:string,english:string,flagId:string) {
    const snapshot=current.current;
    if(!snapshot||snapshot.presentationLanguage!=='en'||!source.trim()||!english.trim()||source.length>5000||english.length>5000){onError('Enter original and English text under 5,000 characters each.');return;}
    if(source===snapshot.text&&english===snapshot.presentedText)return;
    const review=currentReview(snapshot.meaningReview,snapshot.text,snapshot.presentedText);
    const at=new Date().toISOString();
    void persist({...snapshot,text:source,presentedText:english,segments:source===snapshot.text?snapshot.segments:[],meaningReview:{source,english,checked:{},events:[...review.events,{at,action:'corrected' as const,flagId,sourceBefore:snapshot.text,englishBefore:snapshot.presentedText,sourceAfter:source,englishAfter:english}].slice(-50)},updatedAt:at}).then(()=>setNotice('Correction saved on this phone. Review the updated meaning checks.')).catch(error=>onError(errorText(error)));
  }

  function chooseLanguage(language: SavedTranscript['language']) {
    const snapshot = current.current;
    if (!snapshot) return;
    void persist({ ...snapshot, language, updatedAt: new Date().toISOString() }).catch(error => onError(errorText(error)));
  }

  return <View style={styles.stack}>
    <Text accessibilityRole="header" style={styles.title}>Transcribe anywhere.</Text>
    <Text style={styles.body}>Record speech, review the words and keep the transcript on this phone.</Text>
    <Text style={styles.small}>Spoken language is detected automatically. Override it only when recognition needs help.</Text>
    <View style={styles.row}>{speechLanguages.map(item => <Button key={item.code} title={item.label} secondary={draft?.language !== item.code} disabled={!draft || !!working} onPress={() => chooseLanguage(item.code)} />)}</View>
    {recording ? <Pressable accessibilityRole="button" onPress={() => void finish()} style={local.recordButton}><Text style={local.recordText}>Stop & transcribe</Text><Text style={local.recordHint}>20 seconds maximum</Text></Pressable>
      : <Pressable accessibilityRole="button" disabled={!draft || !!working} onPress={() => void start()} style={[local.recordButton, (!draft || !!working) && styles.disabled]}><Text style={local.recordText}>●  Start recording</Text><Text style={local.recordHint}>Local multilingual transcription</Text></Pressable>}
    {!!draft?.audioUri && <Button title="Transcribe saved audio" disabled={!!working} onPress={() => void transcribe()} />}
    {!!working && <Text accessibilityLiveRegion="polite" style={styles.body}>{working}</Text>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={styles.small}>{notice}</Text>}
    {!!draft?.detectedLanguage&&<Text style={styles.small}>Spoken language: {draft.detectedLanguage==='auto'?'detected automatically':draft.detectedLanguage}</Text>}
    <Text style={styles.label}>Present transcript in</Text>
    <View style={styles.row}><Button title="English · recommended" secondary={draft?.presentationLanguage!=='en'} disabled={!draft||!!working} onPress={()=>void choosePresentation('en')}/><Button title="Original" secondary={draft?.presentationLanguage!=='original'} disabled={!draft||!!working} onPress={()=>void choosePresentation('original')}/></View>
    <View style={styles.row}>{speechLanguages.filter(item=>item.code!=='auto'&&item.code!=='en').map(item=><Button key={item.code} title={item.label} secondary={draft?.presentationLanguage!==item.code} disabled={!draft||!!working} onPress={()=>void choosePresentation(item.code as Exclude<TargetLanguage,'original'>)}/>)}</View>
    <View style={styles.card}><Text style={styles.label}>Presented transcript</Text><Text selectable style={styles.body}>{draft?.presentationLanguage==='original'?draft?.text||'Record to see your words.':draft?.presentedText||'Record to load the transcript. If presentation fails, choose Original or install the language model in Setup.'}</Text>{!!draft?.text&&!draft?.presentedText&&draft.presentationLanguage!=='original'&&<Button title="Retry presentation" secondary disabled={!!working} onPress={()=>void choosePresentation(draft.presentationLanguage)}/>}</View>
    {draft?.presentationLanguage==='en'&&!!draft.text.trim()&&!!draft.presentedText.trim()&&<MeaningCheck draft={draft} disabled={!!working||recording} onConfirm={confirmMeaning} onCorrect={correctMeaning} onError={onError}/>}
    <Input label="Original spoken words · editable" multiline value={draft?.text ?? ''} onChangeText={edit} editable={!!draft && !working} maxLength={5000} placeholder="Your words appear here. You can also type directly." />
    {!!draft?.original && draft.text !== draft.original && <View style={styles.notice}><Text style={styles.label}>Original machine text</Text><Text style={styles.body}>{draft.original}</Text></View>}
    <View style={styles.row}>
      <Button title="New transcript" secondary disabled={!draft || !!working} onPress={() => { void persist(fresh()).then(() => setNotice('New transcript ready. Previous work remains saved.')).catch(error => onError(errorText(error))); }} />
      <Button title="Share text" secondary disabled={!(draft?.presentationLanguage==='original'?draft?.text:draft?.presentedText)?.trim() || !!working} onPress={() => { void Share.share({ message: draft?.presentationLanguage==='original'?draft?.text??'':draft?.presentedText??'' }).catch(error => onError(errorText(error))); }} />
    </View>
    <Text accessibilityRole="header" style={styles.label}>Saved transcripts</Text>
    {history.length ? history.map(item => <Button key={item.id} title={`${new Date(item.updatedAt).toLocaleDateString()} · ${(item.text || 'Saved audio').slice(0, 38)}`} secondary disabled={!!working} onPress={() => { void persist({ ...item, presentationLanguage:item.presentationLanguage??'en',presentedText:item.presentedText??'',updatedAt: new Date().toISOString() }).then(() => setNotice('Saved transcript opened.')).catch(error => onError(errorText(error))); }} />) : <Text style={styles.small}>Your recordings and text appear here after saving.</Text>}
    <Text style={styles.small}>Speech runs locally after its model is installed in Setup. Keep important work by sharing the text; deleting app data also deletes these transcripts.</Text>
  </View>;
}

const local = StyleSheet.create({
  recordButton: { minHeight: 116, backgroundColor: colors.highlight, borderColor: colors.ink, borderWidth: 3, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 16 },
  recordText: { color: colors.ink, fontSize: 27, fontWeight: '800', textAlign: 'center' },
  recordHint: { color: colors.ink, fontSize: 16, marginTop: 4 },
});
