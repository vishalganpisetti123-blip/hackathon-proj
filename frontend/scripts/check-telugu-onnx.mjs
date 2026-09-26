import { readFile } from 'node:fs/promises';
import { pipeline, env } from '@huggingface/transformers';

env.localModelPath = './public/models/';
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.useFSCache = false;
const languageCode = process.argv.find(arg=>arg.startsWith('--language='))?.split('=')[1] ?? 'te';
const names = {te:'telugu',hi:'hindi',ta:'tamil',bn:'bengali',mr:'marathi',zh:'chinese'};
const language = names[languageCode];
if (!language) throw new Error(`Unsupported language: ${languageCode}`);
async function readWav(path) {
  const file = await readFile(path);
  if (file.toString('ascii', 0, 4) !== 'RIFF' || file.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Expected WAV');
  let position = 12; let data = null;
  while (position < file.length) {
    const id = file.toString('ascii', position, position + 4);
    const size = file.readUInt32LE(position + 4);
    if (id === 'fmt ' && (file.readUInt16LE(position + 8) !== 1 || file.readUInt16LE(position + 10) !== 1 || file.readUInt32LE(position + 12) !== 16000 || file.readUInt16LE(position + 22) !== 16)) throw new Error('Expected 16 kHz mono PCM16');
    if (id === 'data') data = file.subarray(position + 8, position + 8 + size);
    position += 8 + size + (size % 2);
  }
  if (!data) throw new Error('No WAV data');
  const audio = new Float32Array(data.length / 2);
  for (let i = 0; i < audio.length; i++) audio[i] = data.readInt16LE(i * 2) / 32768;
  return audio;
}
function distance(a,b) {
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++) {
    const next=[i];
    for(let j=1;j<=b.length;j++) next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));
    row=next;
  }
  return row[b.length];
}
function normalize(text) {return text.toLowerCase().replace(/\p{P}/gu,' ').replace(/\s+/g,' ').trim();}
const pipe = await pipeline('automatic-speech-recognition', `fieldproof/whisper-${language}-small`, { device: 'cpu', dtype: 'q8' });
if(process.argv.includes('--all')) {
  const manifest=(await readFile(`../training/data/${['te','hi'].includes(languageCode)?'fleurs':'fleurs-extra'}.jsonl`,'utf8')).trim().split('\n').map(JSON.parse);
  const rows=manifest.filter(row=>row.split==='test'&&row.language===languageCode);
  let words=0,wordErrors=0,chars=0,charErrors=0;
  for(const row of rows) {
    const audio=await readWav(`../training/${row.audio}`);
    const result=await pipe(audio,{language,task:'transcribe',chunk_length_s:20,stride_length_s:3});
    const reference=normalize(row.text), hypothesis=normalize(result.text);
    const rw=reference.split(' '),hw=hypothesis.split(' ');
    words+=rw.length;wordErrors+=distance(rw,hw);chars+=reference.length;charErrors+=distance([...reference],[...hypothesis]);
    console.log(JSON.stringify({id:row.id,reference:row.text,hypothesis:result.text}));
  }
  console.log(JSON.stringify({clips:rows.length,wer:wordErrors/words,cer:charErrors/chars}));
} else {
  const path=process.argv.find(arg=>arg.endsWith('.wav'))??'../training/data/fleurs/te_in-test-1912.wav';
  const result=await pipe(await readWav(path),{language,task:'transcribe',chunk_length_s:20,stride_length_s:3});
  console.log(JSON.stringify(result));
}
await pipe.dispose();
