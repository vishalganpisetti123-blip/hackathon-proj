"""Small diagnostic of one specialist on local FLEURS clips."""
import argparse
import json
import re
import unicodedata
from pathlib import Path

import soundfile as sf
import torch
from jiwer import cer, wer
from transformers import WhisperForConditionalGeneration, WhisperProcessor

ROOT = Path(__file__).resolve().parent
CONFIG = {
    'hi': ('hindi', 'data/fleurs.jsonl'),
    'te': ('telugu', 'data/fleurs.jsonl'),
    'bn': ('bengali', 'data/fleurs-extra.jsonl'),
    'mr': ('marathi', 'data/fleurs-extra.jsonl'),
    'ta': ('tamil', 'data/fleurs-extra.jsonl'),
    'zh': ('chinese', 'data/fleurs-extra.jsonl'),
}


def norm(text):
    text = unicodedata.normalize('NFC', text).lower()
    return re.sub(r'\s+', ' ', ''.join(
        char if not unicodedata.category(char).startswith('P') else ' '
        for char in text
    )).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True)
    parser.add_argument('--language', required=True, choices=CONFIG)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    name, manifest = CONFIG[args.language]
    rows = [json.loads(line) for line in (ROOT / manifest).read_text().splitlines()]
    rows = [row for row in rows if row['split'] == 'test' and row['language'] == args.language]
    assert len(rows) == 6
    torch.set_num_threads(2)
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    processor = WhisperProcessor.from_pretrained(args.model, cache_dir=ROOT / 'cache')
    model = WhisperForConditionalGeneration.from_pretrained(
        args.model, cache_dir=ROOT / 'cache', attn_implementation='eager'
    ).to(device).eval()
    model.generation_config.forced_decoder_ids = processor.get_decoder_prompt_ids(
        language=args.language, task='transcribe'
    )
    predictions = []
    with torch.inference_mode():
        for row in rows:
            waveform, rate = sf.read(ROOT / row['audio'], dtype='float32')
            assert rate == 16000
            features = processor.feature_extractor(waveform, sampling_rate=rate, return_tensors='pt').input_features.to(device)
            tokens = model.generate(features, max_new_tokens=400, do_sample=False)
            hypothesis = processor.batch_decode(tokens, skip_special_tokens=True)[0]
            predictions.append({'id': row['id'], 'reference': row['text'], 'hypothesis': hypothesis})
            print(row['id'], hypothesis, flush=True)
    reference = [norm(row['reference']) for row in predictions]
    hypothesis = [norm(row['hypothesis']) for row in predictions]
    metrics = {'clips': len(rows), 'wer': wer(reference, hypothesis), 'cer': cer(reference, hypothesis)}
    output = {
        'model': args.model, 'language': args.language, 'metrics': metrics,
        'predictions': predictions,
        'limitations': 'Six FLEURS read-speech clips; may overlap model development/selection. No code switching, field noise, or quantized runtime test.',
    }
    (ROOT / args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2))
    print(json.dumps(metrics), flush=True)


if __name__ == '__main__':
    main()
