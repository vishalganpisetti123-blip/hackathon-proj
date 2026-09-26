export type MeaningFlag = {
  id: string;
  kind: 'negation' | 'quantity' | 'critical-term' | 'general';
  title: string;
  reason: string;
  sourceRange: [number, number] | null;
  englishRange: [number, number] | null;
};

export type MeaningEvent = {
  at: string;
  action: 'checked' | 'corrected';
  flagId?: string;
  sourceBefore: string;
  englishBefore: string;
  sourceAfter?: string;
  englishAfter?: string;
};

export type MeaningReview = {
  source: string;
  english: string;
  checked: Record<string, string>;
  events: MeaningEvent[];
};

export type TimedPhrase = { text: string; start: number; end: number };
type Token = { value: string; start: number; end: number };

const negations = new Set([
  'no','not','never','without','cannot',"can't","don't","doesn't","didn't","won't","isn't","wasn't","shouldn't","mustn't",
  'नहीं','नही','मत','नाही','नको','नकोस','లేదు','కాదు','వద్దు','లేకుండా','না','নয়','নেই','இல்லை','வேண்டாம்','கூடாது',
  '不','没','無','无','别','勿','nunca','sin','jamais','pas','sans','لا','ليس','بدون','nahi','nahin','ledu','kaadu','vaddu','illai','nako',
]);
const englishNegations = new Set(['no','not','never','without','cannot',"can't","don't","doesn't","didn't","won't","isn't","wasn't","shouldn't","mustn't"]);

const concepts = [
  { name:'valve', source:['valve','वाल्व','వాల్వ్','ভালভ','வால்வு','válvula','vanne','صمام'], english:['valve'] },
  { name:'pump', source:['pump','पंप','पम्प','పంపు','পাম্প','பம்ப்','bomba','pompe','مضخة'], english:['pump'] },
  { name:'motor', source:['motor','मोटर','मोटार','మోటార్','মোটর','மோட்டார்','موتور'], english:['motor'] },
  { name:'pressure', source:['pressure','दबाव','प्रेशर','ఒత్తిడి','চাপ','அழுத்தம்','presión','pression','ضغط'], english:['pressure','psi'] },
  { name:'leak', source:['leak','लीक','रिसाव','లీక్','ফুটো','கசிவு','fuga','fuite','تسرب'], english:['leak','leaking'] },
  { name:'gas', source:['gas','गैस','గ్యాస్','গ্যাস','எரிவாயு','غاز'], english:['gas'] },
  { name:'fire', source:['fire','आग','మంట','আগুন','தீ','fuego','incendie','حريق'], english:['fire'] },
  { name:'breaker', source:['breaker','ब्रेकर','బ్రేకర్','ব্রেকার','பிரேக்கர்','قاطع'], english:['breaker'] },
  { name:'open', source:['open','खोलो','खोलें','తెరవండి','खोला','খুলুন','திறக்க','abrir','ouvrir','افتح'], english:['open'] },
  { name:'close', source:['close','बंद','बन्द','మూసి','বন্ধ','மூடு','cerrar','fermer','أغلق'], english:['close','closed','shut'] },
];

function tokens(text: string): Token[] {
  return [...text.matchAll(/[\u3400-\u9fff]|[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu)].map(match => ({
    value: match[0].normalize('NFC').toLocaleLowerCase(), start: match.index, end: match.index + match[0].length,
  }));
}

const digitBases = [0x30,0x660,0x6f0,0x966,0x9e6,0xbe6,0xc66,0xff10];
function decimalDigits(value: string): string {
  return [...value].map(character => {
    const code = character.codePointAt(0)!;
    const base = digitBases.find(item => code >= item && code < item + 10);
    return base === undefined ? character : String(code - base);
  }).join('').replace('٫','.');
}
const numberWords: Record<string,number> = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,
  twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,
};
function quantities(text: string): Array<{value:string;range:[number,number]}> {
  const found = [...text.matchAll(/[\p{Nd}]+(?:[.,٫][\p{Nd}]+)?/gu)].map(match => ({value:decimalDigits(match[0]).replace(/,/g,''),range:[match.index,match.index+match[0].length] as [number,number]}));
  const words = tokens(text);
  for(let i=0;i<words.length;i++) {
    const first = numberWords[words[i].value];
    if(first === undefined) continue;
    const second = words[i+1] && numberWords[words[i+1].value];
    const combined = first >= 20 && first < 100 && first % 10 === 0 && second !== undefined && second > 0 && second < 10 && /^[\s-]+$/.test(text.slice(words[i].end,words[i+1].start));
    found.push({value:String(combined ? first+second! : first),range:[words[i].start,combined?words[i+1].end:words[i].end]});
    if(combined)i++;
  }
  return found;
}

function range(token:Token):[number,number] { return [token.start,token.end]; }
export function meaningFlags(source:string, english:string):MeaningFlag[] {
  if(!source.trim() || !english.trim()) return [];
  const sourceWords=tokens(source), englishWords=tokens(english);
  const sourceNo=sourceWords.filter(word=>negations.has(word.value));
  const englishNo=englishWords.filter(word=>englishNegations.has(word.value));
  const flags:MeaningFlag[]=[];
  for(const word of sourceNo.slice(englishNo.length))flags.push({id:`negation:source:${word.start}:${word.value}`,kind:'negation',title:'Check a possible missing “not”',reason:'The original has a negation marker that may not be reflected in English. Replay and compare the intended meaning.',sourceRange:range(word),englishRange:null});
  for(const word of englishNo.slice(sourceNo.length))flags.push({id:`negation:english:${word.start}:${word.value}`,kind:'negation',title:'Check a possible added “not”',reason:'English has a negation marker that was not found in the original text. The original may use an expression this check does not know.',sourceRange:null,englishRange:range(word)});
  const sourceNumbers=quantities(source), englishNumbers=quantities(english);
  const englishValues=new Set(englishNumbers.map(item=>item.value));
  const sourceValues=new Set(sourceNumbers.map(item=>item.value));
  for(const item of sourceNumbers)if(!englishValues.has(item.value))flags.push({id:`quantity:source:${item.range[0]}:${item.value}`,kind:'quantity',title:`Check quantity ${item.value}`,reason:'This number was not found in the English version. Spoken number words or formatting can cause a false alarm.',sourceRange:item.range,englishRange:null});
  for(const item of englishNumbers)if(!sourceValues.has(item.value))flags.push({id:`quantity:english:${item.range[0]}:${item.value}`,kind:'quantity',title:`Check English quantity ${item.value}`,reason:'This number was not found in the original text. Spoken number words or formatting can cause a false alarm.',sourceRange:null,englishRange:item.range});
  for(const concept of concepts) {
    const hit=sourceWords.find(word=>concept.source.includes(word.value));
    if(!hit)continue;
    const translated=englishWords.find(word=>concept.english.includes(word.value));
    flags.push({id:`term:${concept.name}:${hit.start}`,kind:'critical-term',title:`Check “${concept.name}”`,reason:translated?'This operational term appears in both versions. Confirm that the instruction still means the same thing.':'This operational term was not matched in English. A synonym may be valid; compare it with the recording.',sourceRange:range(hit),englishRange:translated?range(translated):null});
  }
  return flags.length ? flags.slice(0,12) : [{id:'general:full',kind:'general',title:'Compare the full message',reason:'No common risk markers were found. That is not proof the transcript or translation is correct; check both against the recording.',sourceRange:null,englishRange:null}];
}

export function replaySpan(flag:MeaningFlag, source:string, phrases:TimedPhrase[]):[number,number]|null {
  if(!flag.sourceRange)return null;
  const lower=source.toLocaleLowerCase();let cursor=0;
  for(const phrase of phrases) {
    const words=phrase.text.trim().toLocaleLowerCase();
    if(!words || !Number.isFinite(phrase.start) || !Number.isFinite(phrase.end) || phrase.end<=phrase.start)continue;
    const found=lower.indexOf(words,cursor);
    if(found<0)continue;
    cursor=found+words.length;
    if(found<=flag.sourceRange[0] && cursor>=flag.sourceRange[1] && phrase.end-phrase.start<=8) return [Math.max(0,phrase.start-0.8),phrase.end+0.8];
  }
  return null;
}

export function currentReview(review:MeaningReview|undefined,source:string,english:string):MeaningReview {
  return review?.source===source && review.english===english ? review : {source,english,checked:{},events:review?.events??[]};
}
