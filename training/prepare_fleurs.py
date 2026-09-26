"""Download bounded public FLEURS subsets, preserving official train/test separation."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import fsspec
import pyarrow.parquet as pq
import requests
import soundfile as sf

ROOT = Path(__file__).resolve().parent
LANGUAGES = {'en_us': 'en', 'hi_in': 'hi', 'te_in': 'te', 'bn_in': 'bn', 'mr_in': 'mr', 'ta_in': 'ta', 'cmn_hans_cn': 'zh', 'es_419': 'es', 'ar_eg': 'ar', 'fr_fr': 'fr'}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--train', type=int, default=30)
    parser.add_argument('--test', type=int, default=6)
    parser.add_argument('--languages', default='en_us,hi_in,te_in')
    parser.add_argument('--output', default='fleurs.jsonl')
    args = parser.parse_args()
    target = ROOT / 'data' / 'fleurs'
    target.mkdir(parents=True, exist_ok=True)
    revision = requests.get('https://huggingface.co/api/datasets/google/fleurs/revision/refs%2Fconvert%2Fparquet', timeout=30).json()['sha']
    rows = []
    requested = [item.strip() for item in args.languages.split(',')]
    if any(item not in LANGUAGES for item in requested): raise ValueError('Unsupported language config')
    for config in requested:
        language = LANGUAGES[config]
        for split, count in [('train', args.train), ('test', args.test)]:
            if count == 0: continue
            saved = target / f'{config}-{split}.json'
            if saved.exists():
                rows.extend(json.loads(saved.read_text())); continue
            print(f'Fetching {config}/{split}: up to {count} clips', flush=True)
            listing = requests.get(f'https://huggingface.co/api/datasets/google/fleurs/tree/{revision}/{config}/{split}', timeout=30)
            listing.raise_for_status()
            source = 'https://huggingface.co/datasets/google/fleurs/resolve/' + revision + '/' + listing.json()[0]['path']
            selected = []; seen = set()
            with fsspec.open(source, 'rb', block_size=2**20, cache_type='readahead', client_kwargs={'trust_env': True}) as stream:
                parquet = pq.ParquetFile(stream)
                for batch in parquet.iter_batches(batch_size=16, columns=['id', 'audio', 'transcription', 'raw_transcription', 'num_samples']):
                    for item in batch.to_pylist():
                        text = item['raw_transcription'] or item['transcription']
                        if not 1 <= item['num_samples'] / 16000 <= 20 or item['id'] in seen: continue
                        audio, rate = sf.read(io.BytesIO(item['audio']['bytes']), dtype='float32')
                        name = f'{config}-{split}-{item["id"]}.wav'
                        sf.write(target / name, audio, rate)
                        digest = hashlib.sha256((target / name).read_bytes()).hexdigest()
                        selected.append({'id': f'{config}-{split}-{item["id"]}', 'sentence_id': item['id'], 'language': language, 'split': split, 'text': text, 'audio': str((target / name).relative_to(ROOT)), 'sha256': digest, 'source': 'google/fleurs', 'revision': revision, 'license': 'CC-BY-4.0'})
                        seen.add(item['id'])
                        if len(selected) >= count: break
                    if len(selected) >= count: break
            saved.write_text(json.dumps(selected, ensure_ascii=False, indent=2))
            rows.extend(selected)
            print(f'Saved {len(selected)} clips', flush=True)
    for language in LANGUAGES.values():
        train_ids = {r['sentence_id'] for r in rows if r['language'] == language and r['split'] == 'train'}
        assert not train_ids.intersection(r['sentence_id'] for r in rows if r['language'] == language and r['split'] == 'test'), 'Train/test sentence overlap'
    (ROOT / 'data' / args.output).write_text(''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in rows))
    print(f'Manifest ready: {len(rows)} recordings', flush=True)

if __name__ == '__main__': main()
