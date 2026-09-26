import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { currentReview, meaningFlags, replaySpan } from '../src/lib/fieldproof/meaning-check';
import { freshTranscript } from '../src/lib/fieldproof/transcription';
import { persistTranscript, readTranscript } from '../src/lib/fieldproof/transcript-storage';

test('flags missing negation and changed quantities without calling the translation safe',()=>{
  const flags=meaningFlags('वाल्व नहीं खोलो 50 psi','Open the valve at 15 psi.');
  assert.ok(flags.some(flag=>flag.kind==='negation'&&flag.sourceRange));
  assert.ok(flags.some(flag=>flag.kind==='quantity'&&flag.title.includes('50')));
  assert.ok(flags.some(flag=>flag.kind==='quantity'&&flag.title.includes('15')));
  assert.ok(flags.some(flag=>flag.kind==='critical-term'&&flag.title.includes('valve')));
  assert.ok(flags.every(flag=>!flag.reason.includes('safe')));
});

test('recognizes non-Latin digits and matching English number words',()=>{
  assert.equal(meaningFlags('पंप ५० बंद है','The pump is closed at 50.').filter(flag=>flag.kind==='quantity').length,0);
  assert.equal(meaningFlags('Pump 50','Pump fifty').filter(flag=>flag.kind==='quantity').length,0);
  assert.equal(meaningFlags('Pump 56','Pump fifty six').filter(flag=>flag.kind==='quantity').length,0);
  assert.ok(meaningFlags('不要打开阀门','Open the valve.').some(flag=>flag.kind==='negation'));
});

test('replays only aligned short audio spans and invalidates stale review decisions',()=>{
  const source='Do not open the valve.';
  const flag=meaningFlags(source,'Do not open the valve.').find(item=>item.title.includes('valve'))!;
  assert.deepEqual(replaySpan(flag,source,[{text:'valve',start:4,end:4.5}]),[3.2,5.3]);
  assert.equal(replaySpan(flag,source,[{text:'valve',start:0,end:20}]),null);
  const review={source,english:'Do not open the valve.',checked:{[flag.id]:'2026-09-26T12:00:00Z'},events:[]};
  assert.equal(currentReview(review,source,review.english).checked[flag.id],review.checked[flag.id]);
  assert.deepEqual(currentReview(review,source,'Open the valve.').checked,{});
  assert.equal(currentReview(review,source,'Open the valve.').events.length,0);
});

test('checked decisions and corrections persist with the local transcript',async()=>{
  const source='Do not open valve 50.';
  const english='Open valve 15.';
  const flag=meaningFlags(source,english)[0];
  const at='2026-09-26T12:00:00Z';
  const transcript={...freshTranscript(),text:source,presentedText:english,meaningReview:{source,english,checked:{[flag.id]:at},events:[{at,action:'checked' as const,flagId:flag.id,sourceBefore:source,englishBefore:english}]}};
  await persistTranscript(transcript);
  const saved=await readTranscript();
  assert.equal(saved?.meaningReview?.checked[flag.id],at);
  assert.equal(saved?.meaningReview?.events[0].sourceBefore,source);
  assert.deepEqual(currentReview(saved?.meaningReview,source,'Do not open valve 50.').checked,{});
});
