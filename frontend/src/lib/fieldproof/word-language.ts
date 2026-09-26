import type { SpeechLanguage } from './transcription';
export type WordLanguage = 'en' | 'hi' | 'te' | 'bn' | 'mr' | 'ta' | 'zh' | 'es' | 'ar' | 'fr' | 'uncertain' | 'other';
export type WordModel = { version: number; labels: ('en'|'hi'|'te')[]; vocabulary: Record<string,number>; weights: number[][]; bias: number[]; threshold: number; margin: number; ambiguous: string[] };
export type TaggedWord = { text: string; start: number; language: WordLanguage; source: 'script'|'model'|'shared spelling'|'context vocabulary'|'unclassified'; word: boolean };
const common: Record<string, 'en'|'hi'|'te'> = {
  the:'en', is:'en', are:'en', please:'en', machine:'en', pump:'en', light:'en', water:'en', smoke:'en', check:'en', not:'en', near:'en', inspect:'en', motor:'en', gate:'en', hello:'en', sir:'en', heat:'en', off:'en', working:'en',
  hai:'hi', hain:'hi', nahi:'hi', nahin:'hi', ke:'hi', paas:'hi', mujhe:'hi', kya:'hi', raha:'hi', bhai:'hi', ka:'hi', ho:'hi',
  daggara:'te', degara:'te', undhi:'te', undi:'te', undhu:'te', cheyandi:'te', cheyali:'te', panicheyatledu:'te', ekkuva:'te', ostundi:'te', vastundi:'te', avvatledu:'te', ayithe:'te',
};
export function modelLanguage(word: string, model: WordModel): WordLanguage {
  const key = word.toLowerCase();
  if (!/^[a-z]{2,25}$/.test(key)) return 'uncertain';
  const padded = ` ${key} `; const counts = new Map<number, number>();
  for (const n of [2,3,4]) for (let i=0;i<=padded.length-n;i++) { const feature = model.vocabulary[padded.slice(i,i+n)]; if (feature !== undefined) counts.set(feature,(counts.get(feature) ?? 0)+1); }
  if (counts.size < 2) return 'uncertain';
  const scores = model.labels.map((_,label) => model.bias[label] + [...counts].reduce((sum,[feature,count]) => sum + model.weights[label][feature]*count,0));
  const highest = Math.max(...scores); const exps = scores.map(value => Math.exp(value-highest)); const total = exps.reduce((a,b)=>a+b,0);
  const ranked = exps.map((value,index)=>({value:value/total,index})).sort((a,b)=>b.value-a.value);
  return ranked[0].value >= model.threshold && ranked[0].value-ranked[1].value >= model.margin ? model.labels[ranked[0].index] : 'uncertain';
}
export function tagWords(text: string, model: WordModel | null, selected: SpeechLanguage = 'auto'): TaggedWord[] {
  const shared = new Set(model?.ambiguous ?? []);
  return [...new Intl.Segmenter(undefined,{granularity:'word'}).segment(text)].map(item => {
    const result: TaggedWord = { text:item.segment,start:item.index,word:Boolean(item.isWordLike),language:'other',source:'unclassified' };
    if (!item.isWordLike || !/\p{L}/u.test(item.segment)) return result;
    if (/[\u0900-\u097f]/u.test(item.segment)) return {...result,language:selected === 'mr' ? 'mr' : selected === 'hi' ? 'hi' : 'uncertain',source:'script'};
    if (/[\u0c00-\u0c7f]/u.test(item.segment)) return {...result,language:'te',source:'script'};
    if (/[\u0980-\u09ff]/u.test(item.segment)) return {...result,language:'bn',source:'script'};
    if (/[\u0b80-\u0bff]/u.test(item.segment)) return {...result,language:'ta',source:'script'};
    if (/[\u4e00-\u9fff]/u.test(item.segment)) return {...result,language:'zh',source:'script'};
    if (/[\u0600-\u06ff]/u.test(item.segment)) return {...result,language:'ar',source:'script'};
    if (selected === 'es' && /[áéíóúñü]/iu.test(item.segment)) return {...result,language:'es',source:'script'};
    if (!/^[a-z]+$/i.test(item.segment)) return {...result,language:'uncertain'};
    const word = item.segment.toLowerCase();
    // The local word classifier was trained only for English, Hindi and Telugu.
    // Do not present its guesses as evidence for a newly selected language.
    if (['bn','mr','ta','zh','es','ar','fr'].includes(selected)) return {...result,language:'uncertain',source:'unclassified'};
    if (common[word]) return {...result,language:common[word],source:'context vocabulary'};
    if (shared.has(word) || ['teen','pani','to','lo','ki','me','main','on'].includes(word)) return {...result,language:'uncertain',source:'shared spelling'};
    return {...result,language:model ? modelLanguage(word,model) : 'uncertain',source:model ? 'model' : 'unclassified'};
  });
}
