'use client';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Play, WarningCircle, PencilSimple } from '@phosphor-icons/react';
import { currentReview, meaningFlags, replaySpan, type MeaningFlag } from '@/lib/fieldproof/meaning-check';
import type { TranscriptDraft } from '@/lib/fieldproof/transcription';
import s from './meaning-check.module.css';

function Excerpt({text,range}:{text:string;range:[number,number]|null}) {
  if(!range)return <span>{text.length>170?`${text.slice(0,170)}…`:text}</span>;
  const start=Math.max(0,range[0]-55),end=Math.min(text.length,range[1]+70);
  return <span>{start?'…':''}{text.slice(start,range[0])}<mark>{text.slice(range[0],range[1])}</mark>{text.slice(range[1],end)}{end<text.length?'…':''}</span>;
}

export function MeaningCheck({draft,disabled,audioRef,onConfirm,onCorrect,onError}:{
  draft:TranscriptDraft;disabled:boolean;audioRef:React.RefObject<HTMLAudioElement|null>;
  onConfirm:(id:string)=>void;onCorrect:(source:string,english:string,id:string)=>void;onError:(message:string)=>void;
}) {
  const flags=meaningFlags(draft.text,draft.presentedText);
  const review=currentReview(draft.meaningReview,draft.text,draft.presentedText);
  const [editing,setEditing]=useState<MeaningFlag|null>(null);
  const [source,setSource]=useState('');const [english,setEnglish]=useState('');
  const stopReplay=useRef<()=>void>(()=>{});
  useEffect(()=>()=>stopReplay.current(),[]);
  if(draft.presentationLanguage!=='en'||!draft.text.trim()||!draft.presentedText.trim())return null;
  const checked=flags.filter(flag=>Boolean(review.checked[flag.id])).length;
  async function replay(flag:MeaningFlag) {
    const player=audioRef.current;
    if(!player){onError('No original recording is saved for this transcript. Compare the text directly.');return;}
    stopReplay.current();player.pause();
    const phrases=draft.chunks.filter(chunk=>chunk.timestamp[0]!==null&&chunk.timestamp[1]!==null).map(chunk=>({text:chunk.text,start:chunk.timestamp[0]!,end:chunk.timestamp[1]!}));
    const span=replaySpan(flag,draft.text,phrases);
    player.currentTime=span?.[0]??0;
    if(span){const end=()=>{if(player.currentTime>=span[1])player.pause();};player.addEventListener('timeupdate',end);stopReplay.current=()=>player.removeEventListener('timeupdate',end);}
    try{await player.play();}catch{onError('Audio playback could not start. The original recording is still saved.');}
  }
  function begin(flag:MeaningFlag){setEditing(flag);setSource(draft.text);setEnglish(draft.presentedText);}
  function saveCorrection(){if(!editing)return;onCorrect(source,english,editing.id);setEditing(null);}
  return <section className={s.review} aria-label="Meaning check">
    <div className={s.heading}><div><p className={s.eyebrow}>TRANSCRIPT REVIEW</p><h2>Meaning check</h2><p>Compare the original and English. These prompts are clues, not a safety verdict.</p></div><strong>{checked} / {flags.length} checked</strong></div>
    <div className={s.flags}>{flags.map(flag=><article key={flag.id} className={s.flag} data-checked={Boolean(review.checked[flag.id])}><div className={s.flagTitle}>{review.checked[flag.id]?<CheckCircle size={23} weight="fill"/>:<WarningCircle size={23}/>}<div><h3>{flag.title}</h3><p>{flag.reason}</p></div></div>
      <div className={s.comparison}><div><small>ORIGINAL WORDS</small><p><Excerpt text={draft.text} range={flag.sourceRange}/></p></div><div><small>ENGLISH PRESENTATION</small><p><Excerpt text={draft.presentedText} range={flag.englishRange}/></p></div></div>
      <div className={s.actions}>{draft.audio&&<button type="button" disabled={disabled} onClick={()=>void replay(flag)}><Play size={16} weight="fill"/>{replaySpan(flag,draft.text,draft.chunks.filter(chunk=>chunk.timestamp[0]!==null&&chunk.timestamp[1]!==null).map(chunk=>({text:chunk.text,start:chunk.timestamp[0]!,end:chunk.timestamp[1]!})))?'Replay moment':'Play full recording'}</button>}<button type="button" disabled={disabled} onClick={()=>begin(flag)}><PencilSimple size={17}/>Correct words</button><button type="button" disabled={disabled||Boolean(review.checked[flag.id])} onClick={()=>onConfirm(flag.id)}><CheckCircle size={18}/>I checked this</button></div>
      {review.checked[flag.id]&&<small className={s.checkedAt}>Checked on this device · {new Date(review.checked[flag.id]).toLocaleString()}</small>}
    </article>)}</div>
    {review.events.length>0&&<details className={s.history}><summary>Recent review decisions ({review.events.length})</summary>{review.events.slice(-5).reverse().map((event,index)=><p key={`${event.at}-${index}`}>{event.action==='checked'?'Flag checked':'Words corrected'} · {new Date(event.at).toLocaleString()}</p>)}</details>}
    {editing&&<div className={s.editor}><h3>Correct the meaning</h3><p>Update the original words and English version together. The machine transcript remains unchanged.</p><label>Original words<textarea value={source} onChange={event=>setSource(event.target.value)} maxLength={10000}/></label><label>English presentation<textarea value={english} onChange={event=>setEnglish(event.target.value)} maxLength={10000}/></label><div className={s.actions}><button type="button" onClick={()=>setEditing(null)}>Cancel</button><button type="button" disabled={disabled||!source.trim()||!english.trim()||(source===draft.text&&english===draft.presentedText)} onClick={saveCorrection}>Save correction</button></div></div>}
    <p className={s.footnote}>Decisions and corrections are saved with this local transcript. Editing or retranscribing asks for a fresh check. No AI confidence or safety certification is implied.</p>
  </section>;
}
