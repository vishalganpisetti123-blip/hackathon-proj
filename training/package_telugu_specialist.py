"""Rebuild an optional, offline Indic website model from its public checkpoint.

Run once with internet and sufficient disk space. The published website then
serves the weights locally; speech is not sent to the model host at runtime.
"""
import hashlib
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from transformers import WhisperForConditionalGeneration, WhisperProcessor, GenerationConfig

ROOT = Path(__file__).resolve().parent
LANGUAGES = {'te': 'telugu', 'hi': 'hindi', 'ta': 'tamil', 'bn': 'bengali', 'mr': 'marathi', 'zh': 'chinese'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--language', choices=LANGUAGES, default='te')
    parser.add_argument('--model', default=None)
    args = parser.parse_args()
    name = LANGUAGES[args.language]
    model_id = args.model or f'vasista22/whisper-{name}-small'
    source = ROOT / f'export/{name}-source'
    exported = ROOT / f'export/whisper-{name}-small'
    public = ROOT.parent / f'frontend/public/models/fieldproof/whisper-{name}-small'
    source.mkdir(parents=True, exist_ok=True)
    print('Consolidating the source checkpoint...', flush=True)
    model = WhisperForConditionalGeneration.from_pretrained(model_id, cache_dir=ROOT / 'cache')
    processor = WhisperProcessor.from_pretrained(model_id, cache_dir=ROOT / 'cache')
    model.save_pretrained(source, safe_serialization=True)
    processor.save_pretrained(source)
    del model
    subprocess.run([
        str(Path(sys.executable).with_name('optimum-cli')), 'export', 'onnx',
        '-m', str(source), '--library-name', 'transformers',
        '--task', 'automatic-speech-recognition-with-past', str(exported),
    ], check=True)
    subprocess.run([sys.executable, str(ROOT / 'quantize_telugu_onnx.py'), '--directory', str(exported)], check=True)
    # Older specialist checkpoints omit the multilingual map required by
    # Transformers.js for an explicit Telugu decoding prefix.
    generic = GenerationConfig.from_pretrained('openai/whisper-small', cache_dir=ROOT / 'cache').to_dict()
    config = json.loads((exported / 'generation_config.json').read_text())
    for key in ('alignment_heads', 'is_multilingual', 'lang_to_id', 'task_to_id', 'no_timestamps_token_id'):
        config[key] = generic[key]
    (exported / 'generation_config.json').write_text(json.dumps(config, indent=2) + '\n')
    public.mkdir(parents=True, exist_ok=True)
    (public / 'onnx').mkdir(exist_ok=True)
    for file in exported.iterdir():
        if file.is_file() and file.suffix in ('.json', '.txt'):
            shutil.copyfile(file, public / file.name)
    hashes = {}
    for file in (exported / 'onnx').glob('*_quantized.onnx'):
        target = public / 'onnx' / file.name
        shutil.copyfile(file, target)
        digest = hashlib.sha256()
        with target.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
        hashes[file.name] = digest.hexdigest()
    assert set(hashes) == {'encoder_model_quantized.onnx', 'decoder_model_merged_quantized.onnx'}
    print(json.dumps({'source': model_id, 'output': str(public), 'sha256': hashes}, indent=2))
    print('Validate the quantized pack before selecting it in the website.', flush=True)


if __name__ == '__main__':
    main()
