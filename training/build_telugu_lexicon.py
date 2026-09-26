"""Build a browser spelling lexicon from manually collected Aksharantar Telugu pairs."""
import hashlib, json, re, zipfile
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parent
source=ROOT/'data/aksharantar/tel.zip'
variants=defaultdict(set)
with zipfile.ZipFile(source) as archive, archive.open('tel_train.json') as lines:
    for line in lines:
        row=json.loads(line)
        roman=row['english word'].lower()
        native=row['native word']
        if row['source']=='Dakshina' and re.fullmatch(r'[a-z]{5,24}',roman) and re.fullmatch(r'[\u0c00-\u0c7f]+',native):
            variants[roman].add(native)
lexicon={roman:next(iter(native)) for roman,native in sorted(variants.items()) if len(native)==1}
assert lexicon['vastundi']=='వస్తుంది'
artifact={'version':1,'source':'AI4Bharat Aksharantar tel_train.json, manually collected Dakshina subset','license':'CC-BY-4.0','entries':lexicon}
out=ROOT.parent/'frontend/public/models/telugu-romanized-lexicon.json'
out.write_text(json.dumps(artifact,ensure_ascii=False,separators=(',',':')))
(ROOT/'results/telugu-lexicon.json').write_text(json.dumps({'entries':len(lexicon),'ambiguous_excluded':sum(len(x)>1 for x in variants.values()),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'artifact_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'example':{'vastundi':lexicon['vastundi']},'limitation':'Spelling data only; suggestions do not measure or improve acoustic ASR by themselves.'},ensure_ascii=False,indent=2))
print(len(lexicon),out.stat().st_size)
