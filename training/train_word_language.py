"""Train a small offline character model from Aksharantar and CMUdict."""
import hashlib
import json
import random
import re
import zipfile
from pathlib import Path
import cmudict
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

ROOT = Path(__file__).resolve().parent
random.seed(42)
def grams(word):
    value = ' ' + word.lower() + ' '
    return [value[i:i+n] for n in (2,3,4) for i in range(len(value)-n+1)]

def read_words(code, split, limit):
    words = set()
    with zipfile.ZipFile(ROOT / f'data/aksharantar/{code}.zip') as archive:
        for line in archive.open(f'{code}_{split}.json'):
            row = json.loads(line); word = row['english word'].strip().lower()
            if re.fullmatch('[a-z]{2,25}', word): words.add(word)
            if len(words) >= limit: break
    return words

def main():
    english = sorted({w.lower() for w in cmudict.words() if re.fullmatch('[a-z]{2,25}', w)})
    random.shuffle(english)
    source = {'en': set(english[:24000]), 'hi': read_words('hin','train',24000), 'te': read_words('tel','train',24000)}
    tests = {'en': set(english[24000:26000]), 'hi': read_words('hin','test',2000), 'te': read_words('tel','test',2000)}
    shared = (source['en'] & source['hi']) | (source['en'] & source['te']) | (source['hi'] & source['te'])
    train_words = set.union(*source.values())
    test_shared = (tests['en'] & tests['hi']) | (tests['en'] & tests['te']) | (tests['hi'] & tests['te'])
    x = []; y = []; tx = []; ty = []
    for label in source:
        train = sorted(source[label] - shared); random.shuffle(train)
        for word in train[:18000]: x.append(word); y.append(label)
        for word in sorted(tests[label] - train_words - test_shared)[:1000]: tx.append(word); ty.append(label)
    vectorizer = CountVectorizer(analyzer=grams, max_features=10000)
    matrix = vectorizer.fit_transform(x)
    model = LogisticRegression(C=2, max_iter=300).fit(matrix, y)
    prediction = model.predict(vectorizer.transform(tx))
    score = model.predict_proba(vectorizer.transform(tx))
    accepted = (score.max(axis=1) >= .75) & ((np.sort(score, axis=1)[:,-1] - np.sort(score,axis=1)[:,-2]) >= .25)
    evaluation = {'train_words': len(x), 'test_words': len(tx), 'accuracy': accuracy_score(ty,prediction), 'accepted_coverage': float(accepted.mean()), 'accepted_accuracy': accuracy_score(np.array(ty)[accepted], prediction[accepted]), 'per_language': classification_report(ty,prediction,output_dict=True), 'limitations': 'Isolated romanized words, not code-switched speech. Shared spellings excluded from evaluation. Uncalibrated scores; never ASR confidence.'}
    artifact = {'version':1,'labels':model.classes_.tolist(),'vocabulary':vectorizer.vocabulary_,'weights':np.round(model.coef_,6).tolist(),'bias':np.round(model.intercept_,6).tolist(),'sources':['AI4Bharat Aksharantar: Hindi and Telugu train splits','CMUdict 1.1.3: English words'],'threshold':.75,'margin':.25,'ambiguous':sorted(shared)}
    target = ROOT.parent / 'frontend/public/models/word-language.json'; target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(artifact, separators=(',',':'), default=int))
    (ROOT / 'results').mkdir(exist_ok=True)
    (ROOT / 'results/word-language.json').write_text(json.dumps(evaluation,indent=2))
    (ROOT / 'results/word-language-provenance.json').write_text(json.dumps({'seed':42, 'training_hash':hashlib.sha256('\n'.join(f'{a}\t{b}' for a,b in zip(x,y)).encode()).hexdigest(), 'test_hash':hashlib.sha256('\n'.join(f'{a}\t{b}' for a,b in zip(tx,ty)).encode()).hexdigest(), 'dataset_hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'data/aksharantar').glob('*.zip')}},indent=2))
    print(json.dumps(evaluation,indent=2))

if __name__ == '__main__': main()
