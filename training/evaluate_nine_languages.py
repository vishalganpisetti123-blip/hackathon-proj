"""Small, reproducible smoke test of the existing generic Whisper model.

Run after prepare_fleurs.py has written fleurs.jsonl and fleurs-extra.jsonl.
These few read-speech clips are diagnostics, not a deployment accuracy claim.
"""
import json
import argparse
import re
import unicodedata
from pathlib import Path

import soundfile as sf
import torch
from jiwer import cer, wer
from transformers import WhisperForConditionalGeneration, WhisperProcessor

ROOT = Path(__file__).resolve().parent
LANGUAGES = {
    'en': 'english', 'hi': 'hindi', 'te': 'telugu', 'bn': 'bengali',
    'mr': 'marathi', 'ta': 'tamil', 'zh': 'chinese', 'es': 'spanish', 'ar': 'arabic', 'fr': 'french',
}


def normalize(text):
    text = unicodedata.normalize('NFC', text).lower()
    return re.sub(r'\s+', ' ', ''.join(
        char if not unicodedata.category(char).startswith('P') else ' '
        for char in text
    )).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--languages', default=','.join(LANGUAGES))
    parser.add_argument('--output', default='results/ten-language-baseline.json')
    args = parser.parse_args()
    selected = args.languages.split(',')
    if not selected or any(code not in LANGUAGES for code in selected):
        raise ValueError('Unsupported language choice')
    paths = [ROOT / 'data/fleurs.jsonl', ROOT / 'data/fleurs-extra.jsonl', ROOT / 'data/fleurs-french.jsonl']
    rows = [json.loads(line) for path in paths for line in path.read_text().splitlines()]
    rows = [row for row in rows if row['split'] == 'test' and row['language'] in selected]
    assert set(row['language'] for row in rows) == set(selected)
    torch.set_num_threads(2)
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    model_id = 'openai/whisper-small'
    processor = WhisperProcessor.from_pretrained(model_id, cache_dir=ROOT / 'cache')
    model = WhisperForConditionalGeneration.from_pretrained(
        model_id, cache_dir=ROOT / 'cache', attn_implementation='eager'
    ).to(device).eval()
    model.generation_config.forced_decoder_ids = None
    predictions = []
    with torch.inference_mode():
        for row in rows:
            audio, rate = sf.read(ROOT / row['audio'], dtype='float32')
            assert rate == 16000
            features = processor.feature_extractor(
                audio, sampling_rate=rate, return_tensors='pt'
            ).input_features.to(device)
            ids = model.generate(
                features, language=LANGUAGES[row['language']], task='transcribe',
                max_new_tokens=192, do_sample=False
            )
            hypothesis = processor.batch_decode(ids, skip_special_tokens=True)[0]
            predictions.append({
                'id': row['id'], 'language': row['language'],
                'reference': row['text'], 'hypothesis': hypothesis,
            })
            print(row['id'], row['language'], hypothesis, flush=True)
    metrics = {}
    for code in selected:
        group = [row for row in predictions if row['language'] == code]
        reference = [normalize(row['reference']) for row in group]
        hypothesis = [normalize(row['hypothesis']) for row in group]
        metrics[code] = {'clips': len(group), 'wer': wer(reference, hypothesis),
                         'cer': cer(reference, hypothesis)}
    result = {
        'model': model_id, 'generation': 'forced selected language; greedy',
        'metrics': metrics, 'predictions': predictions,
        'limitations': 'Six clean read-speech clips per language. No noise, code switching, spontaneous speech, or device-level quantization; WER is not comparable across non-space-delimited scripts.',
    }
    (ROOT / args.output).write_text(
        json.dumps(result, ensure_ascii=False, indent=2)
    )
    print(json.dumps(metrics), flush=True)


if __name__ == '__main__':
    main()
