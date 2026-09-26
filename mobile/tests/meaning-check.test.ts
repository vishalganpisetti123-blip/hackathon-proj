import test from 'node:test';
import assert from 'node:assert/strict';
import { currentReview, meaningFlags, replaySpan } from '../src/meaning-check.ts';

test('phone meaning check flags changed instructions and preserves human review state',()=>{
  const source='వాల్వ్ వద్దు ५० psi';
  const english='Open the valve at 15 psi.';
  const flags=meaningFlags(source,english);
  assert.ok(flags.some(flag=>flag.kind==='negation'));
  assert.ok(flags.some(flag=>flag.kind==='quantity'&&flag.title.includes('50')));
  assert.ok(flags.some(flag=>flag.kind==='critical-term'&&flag.title.includes('valve')));
  const review={source,english,checked:{[flags[0].id]:'2026-09-26T12:00:00Z'},events:[]};
  assert.deepEqual(currentReview(review,source,english).checked,review.checked);
  assert.deepEqual(currentReview(review,source,english+' Please.').checked,{});
});

test('phone uses a short aligned segment or falls back to full recording',()=>{
  const source='Do not open the valve';
  const flag=meaningFlags(source,source).find(item=>item.title.includes('valve'))!;
  assert.deepEqual(replaySpan(flag,source,[{text:'valve',start:3,end:3.5}]),[2.2,4.3]);
  assert.equal(replaySpan(flag,source,[{text:'valve',start:0,end:20}]),null);
});
