"""A bounded, reproducible Whisper adaptation experiment; never auto-publishes weights."""
import copy
import argparse
import json
import random
import re
import time
import unicodedata
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
from jiwer import wer, cer
from transformers import WhisperForConditionalGeneration, WhisperProcessor

ROOT = Path(__file__).resolve().parent
LANGUAGES = {'en': 'english', 'hi': 'hindi', 'te': 'telugu'}

def normalize(text):
    text = unicodedata.normalize('NFC', text).lower()
    return re.sub(r'\s+', ' ', ''.join(c if not unicodedata.category(c).startswith('P') else ' ' for c in text)).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', default=str(ROOT / 'data/fleurs.jsonl'))
    parser.add_argument('--steps', type=int, default=60)
    parser.add_argument('--model', default='openai/whisper-base')
    parser.add_argument('--reevaluate', action='store_true')
    args = parser.parse_args()
    run_name = args.model.rsplit('/', 1)[-1]
    random.seed(42); np.random.seed(42); torch.manual_seed(42); torch.set_num_threads(2)
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    print(f'Training device: {device}', flush=True)
    rows = [json.loads(line) for line in Path(args.manifest).read_text().splitlines()]
    train = [r for r in rows if r['split'] == 'train']; test = [r for r in rows if r['split'] == 'test']
    processor = WhisperProcessor.from_pretrained(args.model, cache_dir=ROOT / 'cache')
    model = WhisperForConditionalGeneration.from_pretrained(args.model, cache_dir=ROOT / 'cache', attn_implementation='eager').to(device)
    model.generation_config.forced_decoder_ids = None
    evaluation_config = copy.deepcopy(model.generation_config)
    prepared = {}
    for row in rows:
        audio, rate = sf.read(ROOT / row['audio'], dtype='float32')
        if rate != 16000: raise ValueError('Expected 16 kHz audio')
        features = processor.feature_extractor(audio, sampling_rate=16000, return_tensors='pt').input_features
        processor.tokenizer.set_prefix_tokens(language=LANGUAGES[row['language']], task='transcribe')
        labels = processor.tokenizer(row['text'], return_tensors='pt').input_ids[:, 1:]
        prepared[row['id']] = (features, labels)

    def evaluate():
        model.eval(); predictions = []
        with torch.inference_mode():
            for row in test:
                features, _ = prepared[row['id']]
                generated = model.generate(features.to(device), language=LANGUAGES[row['language']], task='transcribe', max_new_tokens=192, do_sample=False)
                text = processor.batch_decode(generated, skip_special_tokens=True)[0]
                predictions.append({'id': row['id'], 'language': row['language'], 'reference': row['text'], 'hypothesis': text})
                print('Evaluated', row['id'], flush=True)
        metrics = {}
        for language in LANGUAGES:
            group = [r for r in predictions if r['language'] == language]
            reference = [normalize(r['reference']) for r in group]; hypothesis = [normalize(r['hypothesis']) for r in group]
            metrics[language] = {'wer': wer(reference, hypothesis), 'cer': cer(reference, hypothesis), 'clips': len(group)}
        return {'metrics': metrics, 'predictions': predictions}

    started = time.time(); baseline = evaluate()
    (ROOT / 'results').mkdir(exist_ok=True)
    (ROOT / f'results/{run_name}-baseline.json').write_text(json.dumps(baseline, ensure_ascii=False, indent=2))
    if args.reevaluate:
        del model
        if device == 'mps': torch.mps.empty_cache()
        model = WhisperForConditionalGeneration.from_pretrained(ROOT / f'checkpoints/{run_name}-field-candidate', attn_implementation='eager').to(device)
        model.generation_config = copy.deepcopy(evaluation_config)
        adapted = evaluate()
        result = {'base_model': args.model, 'baseline': baseline, 'adapted': adapted, 'deployed': False, 'generation_settings': 'Same original base generation config for both evaluations; forced language; greedy; max_new_tokens=192; original suppression list.', 'limitation': '18-clip monolingual smoke test; not a release benchmark.'}
        (ROOT / f'results/{run_name}-controlled-evaluation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(json.dumps({'baseline': baseline['metrics'], 'adapted': adapted['metrics']}), flush=True)
        return
    # Freeze encoder and earlier decoder layers to fit the 8 GB development machine.
    for parameter in model.parameters(): parameter.requires_grad_(False)
    for layer in model.model.decoder.layers[-2:]:
        for parameter in layer.parameters(): parameter.requires_grad_(True)
    optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=1e-5)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    model.config.use_cache = False
    model.train(); losses = []
    balanced = {language: [r for r in train if r['language'] == language] for language in LANGUAGES}
    for step in range(args.steps):
        language = list(LANGUAGES)[step % len(LANGUAGES)]
        row = random.choice(balanced[language]); features, labels = prepared[row['id']]
        optimizer.zero_grad(set_to_none=True)
        output = model(input_features=features.to(device), labels=labels.to(device))
        output.loss.backward(); torch.nn.utils.clip_grad_norm_((p for p in model.parameters() if p.requires_grad), 1)
        optimizer.step(); losses.append(float(output.loss.detach().cpu()))
        if step % 5 == 0: print(f'Step {step+1}/{args.steps} loss={losses[-1]:.4f}', flush=True)
    model.config.use_cache = True
    output_dir = ROOT / f'checkpoints/{run_name}-field-candidate'
    adapted = evaluate()
    model.save_pretrained(output_dir); processor.save_pretrained(output_dir)
    # This is an experiment, not a release gate: code-switching and field noise are absent.
    result = {'base_model': args.model, 'device': device, 'steps': args.steps, 'train_clips': len(train), 'test_clips': len(test), 'trainable_parameters': trainable, 'duration_seconds': round(time.time()-started), 'losses': losses, 'baseline': baseline, 'adapted': adapted, 'deployed': False, 'limitation': 'Small monolingual read-speech sample. Does not establish code-switching, field-noise or speaker-generalization accuracy. No browser/native model replaced.'}
    (ROOT / f'results/{run_name}-experiment.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({'baseline': baseline['metrics'], 'adapted': adapted['metrics'], 'deployed': False}), flush=True)

if __name__ == '__main__': main()
