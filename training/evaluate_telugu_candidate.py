"""Compare a Telugu specialist against the baseline on the existing FLEURS test subset."""
import json, re, unicodedata
from pathlib import Path
import torch, soundfile as sf
from jiwer import wer, cer
from transformers import WhisperProcessor, WhisperForConditionalGeneration
ROOT=Path(__file__).resolve().parent
MODEL='vasista22/whisper-telugu-small'

def norm(s):
    s=unicodedata.normalize('NFC',s).lower()
    return re.sub(r'\s+',' ',''.join(c if not unicodedata.category(c).startswith('P') else ' ' for c in s)).strip()
rows=[json.loads(line) for line in (ROOT/'data/fleurs.jsonl').read_text().splitlines()]
rows=[row for row in rows if row['split']=='test' and row['language']=='te']
assert len(rows)==6
old=json.loads((ROOT/'results/whisper-small-controlled-evaluation.json').read_text())['baseline']['predictions']
old=[item for item in old if item['language']=='te']
assert {item['id'] for item in old}=={item['id'] for item in rows}
device='mps' if torch.backends.mps.is_available() else 'cpu'
torch.set_num_threads(2)
processor=WhisperProcessor.from_pretrained(MODEL,cache_dir=ROOT/'cache')
model=WhisperForConditionalGeneration.from_pretrained(MODEL,cache_dir=ROOT/'cache',attn_implementation='eager').to(device).eval()
# Older model card uses forced decoder IDs instead of a generation lang_to_id map.
model.generation_config.forced_decoder_ids=processor.get_decoder_prompt_ids(language='te',task='transcribe')
results=[]
with torch.inference_mode():
    for row in rows:
        waveform,rate=sf.read(ROOT/row['audio'],dtype='float32')
        assert rate==16000
        features=processor.feature_extractor(waveform,sampling_rate=rate,return_tensors='pt').input_features.to(device)
        ids=model.generate(features,max_new_tokens=192,do_sample=False)
        hypothesis=processor.batch_decode(ids,skip_special_tokens=True)[0]
        results.append({'id':row['id'],'reference':row['text'],'hypothesis':hypothesis})
        print(row['id'],hypothesis,flush=True)
ref=[norm(row['reference']) for row in results]
res=[norm(row['hypothesis']) for row in results]
oldhyp=[norm(next(item['hypothesis'] for item in old if item['id']==row['id'])) for row in results]
metrics={'specialist':{'wer':wer(ref,res),'cer':cer(ref,res)},'multilingual_small':{'wer':wer(ref,oldhyp),'cer':cer(ref,oldhyp)}}
(ROOT/'results/telugu-specialist-evaluation.json').write_text(json.dumps({'model':MODEL,'clips':len(rows),'metrics':metrics,'predictions':results,'limitations':'Six FLEURS read-speech clips only; code switching and romanized output are not evaluated. This model card reports FLEURS test usage, so this subset is not independent of its model selection.'},ensure_ascii=False,indent=2))
print(json.dumps(metrics),flush=True)
