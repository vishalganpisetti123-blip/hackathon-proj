"""Six-clip same-runtime diagnostic for a local whisper.cpp GGML model."""
import argparse
import json
import re
import subprocess
import unicodedata
from pathlib import Path

from jiwer import cer, wer

ROOT = Path(__file__).resolve().parent
CLI = ROOT / 'export/whisper.cpp/build/bin/whisper-cli'


def norm(text):
    text = unicodedata.normalize('NFC', text).lower()
    return re.sub(r'\s+', ' ', ''.join(
        char if not unicodedata.category(char).startswith('P') else ' '
        for char in text
    )).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True)
    parser.add_argument('--language', required=True, choices=['hi', 'ta', 'bn', 'mr', 'zh', 'fr'])
    parser.add_argument('--name', required=True)
    args = parser.parse_args()
    manifest = 'fleurs.jsonl' if args.language == 'hi' else 'fleurs-french.jsonl' if args.language == 'fr' else 'fleurs-extra.jsonl'
    rows = [json.loads(line) for line in (ROOT / 'data' / manifest).read_text().splitlines()]
    rows = [row for row in rows if row['language'] == args.language and row['split'] == 'test']
    assert len(rows) == 6
    predictions = []
    for row in rows:
        output = ROOT / 'export' / f'phone-{args.language}' / f'{args.name}-{row["id"]}'
        output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            str(CLI), '-m', args.model, '-f', str(ROOT / row['audio']),
            '-l', args.language, '-nt', '-ng', '-bs', '1', '-bo', '1', '-t', '2',
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
        'settings': f'language={args.language} no_timestamps CPU greedy beam_size=1 best_of=1 threads=2',
        'metrics': metrics, 'predictions': predictions,
        'limitations': 'Six clean FLEURS read-speech clips; not a physical Android run.',
    }
    (ROOT / f'results/phone-{args.language}-{args.name}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps(metrics), flush=True)


if __name__ == '__main__':
    main()
