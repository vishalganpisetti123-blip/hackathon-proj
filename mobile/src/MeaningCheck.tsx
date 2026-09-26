import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { currentReview, meaningFlags, replaySpan, type MeaningFlag } from './meaning-check';
import type { SavedTranscript } from './store';
import { Button, colors, Input, styles } from './ui';

function Excerpt({text,range}:{text:string;range:[number,number]|null}) {
  if(!range)return <Text style={styles.body}>{text.length>180?`${text.slice(0,180)}…`:text}</Text>;
  const start=Math.max(0,range[0]-55),end=Math.min(text.length,range[1]+70);
  return <Text style={styles.body}>{start?'…':''}{text.slice(start,range[0])}<Text style={local.mark}>{text.slice(range[0],range[1])}</Text>{text.slice(range[1],end)}{end<text.length?'…':''}</Text>;
}

export function MeaningCheck({draft,disabled,onConfirm,onCorrect,onError}:{
  draft:SavedTranscript;disabled:boolean;onConfirm:(id:string)=>void;
  onCorrect:(source:string,english:string,id:string)=>void;onError:(error:string)=>void;
}) {
  const player=useAudioPlayer(draft.audioUri??null,{updateInterval:100});
  const status=useAudioPlayerStatus(player);
  const [stopAt,setStopAt]=useState<number|null>(null);
  const [editing,setEditing]=useState<MeaningFlag|null>(null);
  const [source,setSource]=useState('');const [english,setEnglish]=useState('');
  useEffect(()=>{if(stopAt!==null&&status.currentTime>=stopAt&&status.playing){player.pause();setStopAt(null);}},[player,status.currentTime,status.playing,stopAt]);
  useEffect(()=>()=>{player.pause();},[player]);
  if(draft.presentationLanguage!=='en'||!draft.text.trim()||!draft.presentedText.trim())return null;
  const flags=meaningFlags(draft.text,draft.presentedText);
  const review=currentReview(draft.meaningReview,draft.text,draft.presentedText);
  const checked=flags.filter(flag=>Boolean(review.checked[flag.id])).length;
  async function replay(flag:MeaningFlag) {
    if(!draft.audioUri){onError('No original recording is saved for this transcript. Compare the text directly.');return;}
    try {
      const span=replaySpan(flag,draft.text,draft.segments??[]);
      player.pause();await player.seekTo(span?.[0]??0);setStopAt(span?.[1]??null);player.play();
    }catch{onError('Audio playback could not start. The original recording remains saved.');}
  }
  function begin(flag:MeaningFlag){setEditing(flag);setSource(draft.text);setEnglish(draft.presentedText);}
  function save(){if(!editing)return;onCorrect(source,english,editing.id);setEditing(null);}
  return <View style={local.panel}>
    <Text accessibilityRole="header" style={styles.title}>Meaning check</Text>
    <Text style={styles.small}>Compare the original and English. These prompts are clues, not a safety verdict.</Text>
    <Text style={local.count}>{checked} of {flags.length} checked</Text>
    {flags.map(flag=><View key={flag.id} style={[local.flag,review.checked[flag.id]&&local.checked]}>
      <Text style={styles.label}>{flag.title}</Text><Text style={styles.small}>{flag.reason}</Text>
      <View style={local.comparison}><Text style={local.caption}>ORIGINAL WORDS</Text><Excerpt text={draft.text} range={flag.sourceRange}/></View>
      <View style={local.comparison}><Text style={local.caption}>ENGLISH PRESENTATION</Text><Excerpt text={draft.presentedText} range={flag.englishRange}/></View>
      {!!draft.audioUri&&<Button title={replaySpan(flag,draft.text,draft.segments??[]) ? '▶ Replay moment' : '▶ Play full recording'} secondary disabled={disabled||!status.isLoaded} onPress={()=>void replay(flag)}/>}
      <View style={styles.row}><Button title="Correct words" secondary disabled={disabled} onPress={()=>begin(flag)}/><Button title={review.checked[flag.id]?'Checked':'I checked this'} disabled={disabled||Boolean(review.checked[flag.id])} onPress={()=>onConfirm(flag.id)}/></View>
      {!!review.checked[flag.id]&&<Text style={styles.small}>Checked on this phone · {new Date(review.checked[flag.id]).toLocaleString()}</Text>}
    </View>)}
    {!!editing&&<View style={styles.notice}><Text style={styles.label}>Correct the meaning</Text><Text style={styles.small}>Update the original words and English together. The machine result remains available.</Text><Input label="Original words" multiline value={source} onChangeText={setSource} maxLength={5000} editable={!disabled}/><Input label="English presentation" multiline value={english} onChangeText={setEnglish} maxLength={5000} editable={!disabled}/><View style={styles.row}><Button title="Cancel" secondary onPress={()=>setEditing(null)}/><Button title="Save correction" disabled={disabled||!source.trim()||!english.trim()||(source===draft.text&&english===draft.presentedText)} onPress={save}/></View></View>}
    {review.events.slice(-3).reverse().map((event,index)=><Text key={`${event.at}-${index}`} style={styles.small}>{event.action==='checked'?'Checked a flagged point':'Corrected the words'} · {new Date(event.at).toLocaleString()}</Text>)}
    <Text style={styles.small}>Decisions stay with this local transcript. Editing or retranscribing asks for a fresh check. This is not an AI confidence score or safety certification.</Text>
  </View>;
}

const local=StyleSheet.create({
  panel:{gap:12,backgroundColor:colors.white,padding:16,borderWidth:2,borderColor:colors.ink,borderRadius:12},
  count:{fontSize:16,fontWeight:'700',color:colors.primary},
  flag:{gap:10,padding:14,backgroundColor:colors.paper,borderWidth:2,borderColor:colors.line,borderRadius:10},
  checked:{borderColor:colors.primary},
  comparison:{gap:6,padding:12,borderWidth:1,borderColor:colors.line,borderRadius:8,backgroundColor:colors.white},
  caption:{fontSize:13,letterSpacing:1,fontWeight:'700',color:colors.muted},
  mark:{backgroundColor:colors.highlight,color:colors.ink,fontWeight:'800'},
});
