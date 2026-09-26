import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tagWords, modelLanguage, type WordModel } from '../src/lib/fieldproof/word-language';
import { freshTranscript, sentenceSegments, languageOptions, presentationOptions, presentedTranscript } from '../src/lib/fieldproof/transcription';
import { persistTranscript, readTranscript, savedTranscripts } from '../src/lib/fieldproof/transcript-storage';
import { parseBrowserTranslation } from '../src/lib/fieldproof/model-output';
const model: WordModel = JSON.parse(readFileSync(new URL('../public/models/word-language.json', import.meta.url),'utf8'));
test('mixed-language word views preserve every original character, negation and equipment numbers',()=>{
  const text='Pump 17 ke paas पानी hai, leak nahi. మోటార్ దగ్గర water undi!';
  const tokens=tagWords(text,model);
  assert.equal(tokens.map(t=>t.text).join(''),text);
  assert.equal(tokens.find(t=>t.text==='पानी')?.language,'uncertain');
  assert.equal(tagWords('पानी',model,'hi')[0].language,'hi');
  assert.equal(tagWords('पाणी',model,'mr')[0].language,'mr');
  assert.equal(tagWords('বাংলা தமிழ் 中文 العربية',model).filter(t=>t.word).map(t=>t.language).join(','),'bn,ta,zh,ar');
  assert.equal(tokens.find(t=>t.text==='మోటార్')?.language,'te');
  assert.equal(tokens.find(t=>t.text==='nahi')?.language,'hi');
  assert.equal(tokens.find(t=>t.text==='Pump')?.language,'en');
  assert.equal(tokens.find(t=>t.text==='17')?.language,'other');
  assert.equal(tagWords('pani',model)[0].language,'uncertain');
  assert.equal(modelLanguage('x9-noise',model),'uncertain');
  assert.ok(model.weights.every(row=>row.length===Object.keys(model.vocabulary).length));
  assert.equal(sentenceSegments(text).length,2);
});
test('transcript edits, original audio and archives persist locally',async()=>{
  const transcript={...freshTranscript(),original:'मोटर बंद है।',text:'मोटर बंद है। Corrected name.',audio:new Blob(['public test audio'],{type:'audio/wav'})};
  await persistTranscript(transcript,true);
  const restored=await readTranscript();assert.equal(restored?.original,transcript.original);assert.equal(restored?.text,transcript.text);assert.equal(await restored?.audio?.text(),'public test audio');
  await persistTranscript(freshTranscript());
  const archived=(await savedTranscripts()).find(row=>row.id===transcript.id);assert.equal(archived?.text,transcript.text);
});

test('local translation accepts complete JSON after the runtime marker',()=>{
  assert.equal(parseBrowserTranslation('<think> </think> {"translation":"The motor stopped."}'),'The motor stopped.');
  assert.throws(()=>parseBrowserTranslation('<think>guessing</think>{"translation":"wrong"}'),/complete translation/);
  assert.throws(()=>parseBrowserTranslation('{"translation":'),/complete translation/);
});

test('language choices cover the five leading Indian mother tongues and the five global total-speaker languages',()=>{
  const choices=new Set(languageOptions.map(item=>item.value));
  for(const code of ['hi','bn','mr','te','ta','en','zh','es','ar','fr'] as const) assert.ok(choices.has(code));
  assert.equal(choices.size,11); // Ten distinct languages plus Auto.
});
test('English presentation defaults without passing off source-language words as a translation',()=>{
  const source={...freshTranscript(),text:'మోటార్ ఆగిపోయింది'};
  assert.equal(source.language,'auto');
  assert.equal(source.presentationLanguage,'en');
  assert.equal(presentedTranscript(source),'');
  assert.equal(presentedTranscript({...source,presentedText:'The motor stopped.'}),'The motor stopped.');
  assert.equal(presentedTranscript({...source,presentationLanguage:'original'}),source.text);
  assert.ok(presentationOptions.some(option=>option.value==='te'));
});
