'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Microphone, Stop, UploadSimple, DownloadSimple, Copy, FloppyDisk, Plus, Waveform, ShieldCheck, Translate, ClockCounterClockwise, GearSix, X, CircleNotch } from '@phosphor-icons/react';
import { useTranscriber } from './use-transcriber';
import { TranscriptView } from './TranscriptView';
import { MeaningCheck } from './MeaningCheck';
import { bundledSpecialists, languageOptions, presentationOptions, presentedTranscript, type PresentationLanguage, type SpeechLanguage, type SpeechModel } from '@/lib/fieldproof/transcription';
import { cancelAI } from '@/lib/fieldproof/ai';
import s from './transcriber.module.css';

export function Transcriber() {
  const state = useTranscriber(); const [panel,setPanel] = useState<'settings'|'saved'>('settings'); const [audioUrl,setAudioUrl] = useState(''); const [preparingOffline,setPreparingOffline] = useState(false);
  const file = useRef<HTMLInputElement>(null); const audio = useRef<HTMLAudioElement>(null);
  useEffect(()=>{
    // The URL owns a browser Blob resource and must be revoked when it changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if(!state.draft?.audio) {setAudioUrl('');return;}
    const url = URL.createObjectURL(state.draft.audio); setAudioUrl(url); return()=>URL.revokeObjectURL(url);
  },[state.draft?.audio]);
  const presented = state.draft ? presentedTranscript(state.draft) : '';
  function download() {if(!state.draft||!presented)return; const url=URL.createObjectURL(new Blob([presented],{type:'text/plain;charset=utf-8'})); const link=document.createElement('a');link.href=url;link.download=`fieldproof-transcript-${state.draft.id.slice(0,8)}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function prepareOffline() {
    setPreparingOffline(true); state.setError('');
    try {
      if (!('serviceWorker' in navigator)) throw new Error('Offline installation needs a supported browser over HTTPS or localhost.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      const worker = registration.installing ?? registration.waiting;
      if (worker && worker.state !== 'activated') await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Offline installation timed out. Check your connection and retry.')), 120000);
        const changed = () => { if (worker.state === 'activated') { clearTimeout(timeout); resolve(); } else if (worker.state === 'redundant') { clearTimeout(timeout); reject(new Error('Offline installation failed. Check your connection and retry.')); } };
        worker.addEventListener('statechange', changed); changed();
      });
      await navigator.storage?.persist?.();
      state.setNotice('Website prepared for offline use. Prepare your speech model above, then test both without internet.');
    } catch (cause) { state.setError(cause instanceof Error ? cause.message : 'Could not prepare the offline website.'); }
    finally { setPreparingOffline(false); }
  }
  return <main className={s.studio}>
    <header className={s.header}><Link href="/" className={s.brand}><Waveform size={27} weight="bold"/>fieldproof<span>TRANSCRIBE</span></Link><nav aria-label="Main"><Link href="/transcribe" aria-current="page">Transcribe</Link><Link href="/analyze">Language lab</Link></nav><span className={s.private}><ShieldCheck size={17}/>On-device AI</span></header>
    <div className={s.studioBody}><section className={s.mainPanel}><div className={s.titleRow}><div><p className={s.kicker}>10 LANGUAGES · LOCAL SPEECH AI</p><h1>Speak naturally.<br/><span>Keep every word.</span></h1></div><button className={s.secondary} disabled={state.locked} onClick={()=>void state.fresh()}><Plus size={18}/>New session</button></div>
      <p className={s.description}>Transcribe mixed-language speech, review spelling by ear, and present the result in the language you choose.</p>
      {state.error && <div role="alert" className={`${s.message} ${s.error}`}><span>{state.error}</span><button aria-label="Dismiss error" onClick={()=>state.setError('')}><X size={18}/></button></div>}
      {state.notice && <div role="status" className={s.message}><span>{state.notice}</span><button aria-label="Dismiss message" onClick={()=>state.setNotice('')}><X size={18}/></button></div>}
      {state.busy && state.busy!=='microphone' && <div className={s.message} role="status"><CircleNotch className={s.spinning} size={22}/><span>{state.progress || 'Opening audio…'}</span>{state.busy!=='import'&&<button onClick={()=>cancelAI()}>Cancel</button>}</div>}
      <div className={s.capturePanel}><div className={s.captureHeading}><span><Microphone size={18}/> Voice capture</span><span>Up to 2 minutes per recording</span></div><button className={`${s.recordButton} ${state.recording?s.isRecording:''}`} disabled={Boolean(state.busy)||!state.draft} onClick={()=>void state.start()}>{state.recording?<Stop size={32} weight="fill"/>:<Microphone size={34} weight="light"/>}<span><strong>{state.recording?`Stop & transcribe · ${Math.floor(state.seconds/60)}:${String(state.seconds%60).padStart(2,'0')}`:'Record & transcribe'}</strong><small>{state.recording?'Recording on this device':'Your audio stays on this device'}</small></span><Waveform size={35} weight="light"/></button><div className={s.captureFooter}><button disabled={state.locked||!state.draft} onClick={()=>file.current?.click()}><UploadSimple size={18}/>Upload audio</button><span>{state.draft?.language==='auto'?'Auto / mixed languages':languageOptions.find(item=>item.value===state.draft?.language)?.label}</span></div><input ref={file} type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.flac" className={s.srOnly} aria-label="Upload audio file" onChange={event=>{const selected=event.target.files?.[0];if(selected)void state.importAudio(selected);event.target.value='';}}/>
        {audioUrl&&<div className={s.audioPlayer}><audio ref={audio} controls src={audioUrl} aria-label="Original recording"/><button className={s.secondary} disabled={state.locked} onClick={()=>void state.transcribe()}>Transcribe saved audio</button></div>}
      </div>
      <section className={s.presentation} aria-label="Presented transcript"><div className={s.presentationTop}><div><h2>Presented transcript</h2><p>English is recommended. The spoken words remain below for review.</p></div><label htmlFor="presentation-language">Present in <select id="presentation-language" value={state.draft?.presentationLanguage??'en'} disabled={state.locked||!state.draft} onChange={event=>state.present(event.target.value as PresentationLanguage)}>{presentationOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div><div className={s.presentationText} aria-live="polite" lang={state.draft?.presentationLanguage==='original'?undefined:state.draft?.presentationLanguage??'en'}>{presented || (state.draft?.text ? 'Presentation pending. Retry below, or choose Original spoken language.' : 'Record or upload audio. The transcript will appear here automatically.')}</div>{!!state.draft?.text&&!presented&&state.draft.presentationLanguage!=='original'&&<button className={s.secondary} disabled={state.locked} onClick={()=>state.refreshPresentation()}>Retry presentation</button>}</section>
      {state.draft&&<MeaningCheck draft={state.draft} disabled={state.locked} audioRef={audio} onConfirm={state.confirmMeaning} onCorrect={state.correctMeaning} onError={state.setError}/>}
      <TranscriptView text={state.draft?.text??''} language={state.draft?.language??'auto'} disabled={state.locked||!state.draft} onChange={state.editText}/>
      <div className={s.actionBar}><span role="status">{state.saved}</span><div><button disabled={!presented||state.locked} onClick={async()=>{try{await navigator.clipboard.writeText(presented);state.setNotice('Presented transcript copied.');}catch{state.setError('Clipboard unavailable. Use Export text.');}}}><Copy size={18}/>Copy</button><button disabled={!presented||state.locked} onClick={download}><DownloadSimple size={18}/>Export text</button><button disabled={(!state.draft?.text&&!audioUrl)||state.locked} onClick={()=>void state.save()}><FloppyDisk size={18}/>Save session</button></div></div>
      {state.draft?.original&&<details className={s.original}><summary>Original machine transcript {state.draft.text!==state.draft.original?'· edited version above':''}</summary><p>{state.draft.original}</p><small>The original stays separate from your edits.</small></details>}
    </section>
    <aside className={s.sidebar}><div className={s.sideTabs}><button aria-pressed={panel==='settings'} onClick={()=>setPanel('settings')}><GearSix size={18}/>Settings</button><button aria-pressed={panel==='saved'} onClick={()=>setPanel('saved')}><ClockCounterClockwise size={18}/>Saved {state.history.length>0?`(${state.history.length})`:''}</button></div>
      {panel==='saved'?<div className={s.savedList}><h2>On this device</h2>{state.history.length?state.history.map(item=><button key={item.id} disabled={state.locked} onClick={()=>void state.open(item)}><strong>{item.text.slice(0,80)||'Recorded audio'}</strong><small>{new Date(item.updatedAt).toLocaleString()}</small></button>):<p>Save a session to keep its audio, transcript and edits here.</p>}<p className={s.help}>Clearing browser data removes local sessions. Export important text.</p></div>:<>
        <section className={s.settingsGroup}><h2><Translate size={19}/>Speech & language</h2><label htmlFor="spoken-language">Spoken language</label><select id="spoken-language" disabled={state.locked||!state.draft} value={state.draft?.language??'auto'} onChange={event=>state.chooseLanguage(event.target.value as SpeechLanguage)}>{languageOptions.map(item=><option value={item.value} key={item.value}>{item.label}</option>)}</select><p className={s.help}>Auto is the default and detects the spoken language during recording. Choose a known language only to correct recognition.</p><label htmlFor="speech-model">Local speech model</label><select id="speech-model" disabled={state.locked||!state.draft} value={state.draft?.model??'small'} onChange={event=>state.chooseModel(event.target.value as SpeechModel)}>{bundledSpecialists&&state.draft?.language==='te'&&<option value="telugu">Telugu specialist · recommended for Telugu</option>}{bundledSpecialists&&state.draft?.language==='hi'&&<option value="hindi">Hindi specialist · recommended for Hindi</option>}{bundledSpecialists&&state.draft?.language==='ta'&&<option value="tamil">Tamil specialist · recommended for Tamil</option>}{bundledSpecialists&&state.draft?.language==='bn'&&<option value="bengali">Bengali specialist · recommended for Bengali</option>}{bundledSpecialists&&state.draft?.language==='mr'&&<option value="marathi">Marathi specialist · recommended for Marathi</option>}<option value="small">Whisper small · multilingual</option><option value="base">Whisper base · lighter download</option></select><button className={s.prepare} disabled={state.locked||!state.draft} onClick={()=>void state.prepare(state.draft?.model??'small')}><DownloadSimple size={18}/>{state.prepared[state.draft?.model??'small']?'Load & verify model':'Download & prepare model'}</button><p className={s.help}>{bundledSpecialists&&['telugu','hindi','tamil','bengali','marathi'].includes(state.draft?.model??'')?'Single-language specialist. Use multilingual Whisper for mixed-language conversations. The local package is about 414 MB. ':''}{state.prepared[state.draft?.model??'small']?'Prepared previously. Verify before offline use; browsers can clear cached files.':'A first recording starts this download automatically if needed. Prepare it before leaving connectivity.'} Processing speed depends on the device.</p></section>
        <section className={s.offlineNote}><ShieldCheck size={23}/><h2>Ready beyond the signal.</h2><p>Prepare the website and selected speech model while connected. Then test recording and transcription offline.</p><button className={s.prepare} disabled={preparingOffline} onClick={()=>void prepareOffline()}><DownloadSimple size={17}/>{preparingOffline ? 'Preparing website…' : 'Prepare offline website'}</button></section>
      </>}
    </aside></div>
  </main>;
}
