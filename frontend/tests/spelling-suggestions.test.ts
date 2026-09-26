import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { acceptSpellingSuggestion, teluguSplitSuggestions, type TeluguLexicon } from '../src/lib/fieldproof/spelling-suggestions';
import type { WordModel } from '../src/lib/fieldproof/word-language';
const lexicon: TeluguLexicon = JSON.parse(readFileSync(new URL('../public/models/telugu-romanized-lexicon.json',import.meta.url),'utf8'));
const wordModel: WordModel = JSON.parse(readFileSync(new URL('../public/models/word-language.json',import.meta.url),'utf8'));
test('suggests a corpus-backed join for the reported Telugu error while preserving original text',()=>{
  const raw='Pump దగ్గర was tundi, leak nahi.';
  const suggestions=teluguSplitSuggestions(raw,'auto',lexicon,wordModel);
  const match=suggestions.find(item=>item.heard==='was tundi');
  assert.ok(match);assert.equal(match.replacement,'vastundi');assert.equal(match.native,'వస్తుంది');
  assert.equal(acceptSpellingSuggestion(raw,match),'Pump దగ్గర vastundi, leak nahi.');
  assert.equal(raw,'Pump దగ్గర was tundi, leak nahi.');
});
test('avoids English-only, negation, ambiguous and stale corrections',()=>{
  assert.deepEqual(teluguSplitSuggestions('It was tundi.','en',lexicon,wordModel),[]);
  assert.deepEqual(teluguSplitSuggestions('not tundi','te',lexicon,wordModel),[]);
  assert.deepEqual(teluguSplitSuggestions('was there near pump 17','auto',lexicon,wordModel),[]);
  const suggestion=teluguSplitSuggestions('was tundi','te',lexicon,wordModel)[0];
  assert.equal(acceptSpellingSuggestion('new was tundi',suggestion),'new was tundi');
  assert.deepEqual(teluguSplitSuggestions('was tundi','auto',null,wordModel),[]);
});
