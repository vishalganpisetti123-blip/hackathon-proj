import { tagWords, type WordModel } from './word-language';
import type { SpeechLanguage } from './transcription';
export type TeluguLexicon = { version: 1; entries: Record<string,string> };
export type SpellingSuggestion = { start: number; end: number; heard: string; replacement: string; native: string };
const critical = new Set(['not','no','nahi','nahin','never','gas','leak','stop','off','on']);
function candidates(joined: string, entries: Record<string,string>) {
  const hits = new Set<string>();
  if (Object.hasOwn(entries,joined)) hits.add(joined);
  // Aksharantar includes /v/ spellings that an English-oriented recognizer may write with w.
  for(let i=0;i<joined.length;i++) {
    const to = joined[i]==='w'?'v':joined[i]==='v'?'w':'';
    if(to) { const candidate=joined.slice(0,i)+to+joined.slice(i+1); if(Object.hasOwn(entries,candidate)) hits.add(candidate); }
  }
  return [...hits];
}
export function teluguSplitSuggestions(text: string, language: SpeechLanguage, lexicon: TeluguLexicon | null, wordModel: WordModel | null): SpellingSuggestion[] {
  if(!lexicon?.entries || (language!=='te' && language!=='auto')) return [];
  const suggestions: SpellingSuggestion[]=[];
  const words=[...text.matchAll(/\b[a-z]{2,14}\b/gi)];
  for(let index=0;index<words.length-1;index++) {
    if(suggestions.length>=4) break;
    const left=words[index],right=words[index+1];
    const start=left.index??0,end=(right.index??0)+right[0].length;
    if(!/^\s+$/.test(text.slice(start+left[0].length,right.index??0))) continue;
    const first=left[0].toLowerCase(),second=right[0].toLowerCase();
    if(first.length>12||critical.has(first)||critical.has(second)) continue;
    if(language==='auto' && tagWords(second,wordModel)[0]?.language!=='te') continue;
    const joined=first+second;
    if(joined.length<7) continue;
    const hits=candidates(joined,lexicon.entries);
    if(hits.length!==1) continue;
    const replacement=hits[0];
    if(replacement===first || replacement===second) continue;
    suggestions.push({start,end,heard:text.slice(start,end),replacement,native:lexicon.entries[replacement]});
  }
  return suggestions;
}
export function acceptSpellingSuggestion(text: string, suggestion: SpellingSuggestion) {
  if(text.slice(suggestion.start,suggestion.end)!==suggestion.heard) return text;
  return text.slice(0,suggestion.start)+suggestion.replacement+text.slice(suggestion.end);
}
