"""Benchmark the optional GGML Telugu phone candidate with whisper.cpp."""
import json
import argparse
import re
import subprocess
import unicodedata
from pathlib import Path
from jiwer import cer, wer

ROOT = Path(__file__).resolve().parent
CLI = ROOT / 'export/whisper.cpp/build/bin/whisper-cli'
parser = argparse.ArgumentParser()
parser.add_argument('--model', default=str(ROOT / 'export/phone-telugu/ggml-model.bin'))
parser.add_argument('--name', default='telugu-specialist')
args = parser.parse_args()
MODEL = Path(args.model)


def norm(text):
    text = unicodedata.normalize('NFC', text).lower()
    return re.sub(r'\s+', ' ', ''.join(
        char if not unicodedata.category(char).startswith('P') else ' '
        for char in text
    )).strip()


rows = [json.loads(line) for line in (ROOT / 'data/fleurs.jsonl').read_text().splitlines()]
rows = [row for row in rows if row['language'] == 'te' and row['split'] == 'test']
assert len(rows) == 6
predictions = []
for row in rows:
    output = ROOT / 'export/phone-telugu' / f'{args.name}-{row["id"]}'
    subprocess.run([
        str(CLI), '-m', str(MODEL), '-f', str(ROOT / row['audio']),
        '-l', 'te', '-nt', '-ng', '-bs', '1', '-bo', '1', '-t', '2',
        '-otxt', '-of', str(output),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    hypothesis = output.with_suffix('.txt').read_text(errors='replace').strip()
    predictions.append({'id': row['id'], 'reference': row['text'], 'hypothesis': hypothesis})
    print(row['id'], hypothesis, flush=True)
reference = [norm(row['reference']) for row in predictions]
hypothesis = [norm(row['hypothesis']) for row in predictions]
metrics = {'clips': len(rows), 'wer': wer(reference, hypothesis), 'cer': cer(reference, hypothesis)}
result = {
    'model': args.name, 'runtime': 'whisper.cpp CLI',
    'settings': 'language=te no_timestamps CPU greedy beam_size=1 best_of=1 threads=2',
    'metrics': metrics, 'predictions': predictions,
    'limitations': 'Six clean FLEURS read-speech clips; related benchmark family used by source model, not a physical Android run.',
}
(ROOT / f'results/phone-telugu-{args.name}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(metrics), flush=True)
