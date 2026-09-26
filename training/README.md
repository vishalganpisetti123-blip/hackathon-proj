# Local language training and evaluation

This folder contains actual training runs, not a claim that the speech recognizer is now field-ready.

## What ships

`frontend/public/models/word-language.json` is a trained character n-gram logistic-regression model. It identifies likely English, romanized Hindi or romanized Telugu words. The browser runs it without an inference server, alongside script detection and a small common-word vocabulary. It preserves input verbatim and marks ambiguous spellings. It does not transcribe audio, translate, normalize names, or provide ASR confidence.

The training run used 54,000 words (18,000 per language) and a disjoint 3,000-word evaluation. Raw top-choice accuracy: **80.0%**. At the configured score/margin thresholds, coverage was **79.3%** and accuracy on accepted words **86.8%**. Scores are not calibrated confidence. Shared spellings were excluded from this evaluation, so these numbers overstate performance on naturally ambiguous sentences. Browser vocabulary/script overrides are not included in this classifier metric. Full metrics and input hashes are in `results/word-language*.json`.

Speech uses multilingual Whisper base or small pretrained ONNX models, quantized to 8-bit, in a browser worker. The website accepts explicit hints for ten languages and offers Auto for mixed speech. It requires one-time model preparation, sufficient browser memory and an offline check. Hindi, Bengali, Marathi, Telugu and Tamil default to optional locally packaged specialists selected by small six-clip diagnostics; users can choose multilingual Whisper for mixed speech. The separate Android app uses multilingual Whisper small with language hints and can install optional GGML packs for those five Indian languages. Auto-detection does not guarantee correct within-sentence code switching.

## Speech experiments

`prepare_fleurs.py` downloads bounded subsets of the official FLEURS train/test splits: 30 training and six test recordings per language, 90 train / 18 test total, each no longer than 20 seconds. The manifest records source revision, clip and sentence IDs, hashes, language and license. Train/test sentence overlap is rejected. This is read speech, not outdoor noise or code-switched speech.

`train_asr.py` fine-tunes only the final two Whisper decoder layers, seed 42, batch size one, learning rate 1e-5, language-balanced sampling, gradient clipping. It evaluates the pretrained baseline and adapted candidate on the same held-out test subset and saves predictions, WER and CER. MPS was used on the 8 GB Apple M3 host. The base experiment ran 60 updates; the small experiment ran 120. These tiny experiments are feasibility checks, not a broad accuracy guarantee. Comparing multiple candidates on this test subset makes it unsuitable as a final untouched release test.

The initial base experiment showed regression on all three languages and was not deployed. Initial experiment files have a decoding-settings confound: saving the candidate restored the default token-suppression list before candidate evaluation. Do not use those initial before/after scores to claim a training effect. The `--reevaluate` path explicitly reuses the original base generation configuration for both models; `*-controlled-evaluation.json` is the authoritative comparison. See `results/asr-experiment.json` and `results/whisper-small-experiment.json` for exact measurements. Error rates can exceed 100% because word insertions count. The Python float model and browser quantized ONNX runtime are different deployments; the Python results do not establish browser accuracy.

A release candidate needs substantially more paired speech/text, speaker-disjoint development and final test sets, consented field recordings, mixed-language phrases, names/numbers/negation, noise conditions, and phone latency/memory/battery measurements. Choose a model using per-language WER/CER and critical-token errors, not training loss. The five Indic specialists have been quantized and checked in the browser runtime, and five optional phone packs were checked through whisper.cpp CLI, but the current experiments do not fulfill a production accuracy gate. Marathi and Bengali still make many errors on clean read speech.

## Reproduce

Python 3.12. Commands run from the repository root. Dependencies and model/data downloads need internet once; training/inference can subsequently use local caches. The data and checkpoints are git-ignored and can occupy several GB.

```sh
python3.12 -m venv training/.venv
training/.venv/bin/pip install -r training/requirements.txt
training/.venv/bin/python training/prepare_fleurs.py
PYTORCH_ENABLE_MPS_FALLBACK=1 HF_HUB_DISABLE_XET=1 training/.venv/bin/python training/train_asr.py --model openai/whisper-base --steps 60
PYTORCH_ENABLE_MPS_FALLBACK=1 HF_HUB_DISABLE_XET=1 training/.venv/bin/python training/train_asr.py --model openai/whisper-small --steps 120
mkdir -p training/data/aksharantar
curl -L https://huggingface.co/datasets/ai4bharat/Aksharantar/resolve/main/hin.zip -o training/data/aksharantar/hin.zip
curl -L https://huggingface.co/datasets/ai4bharat/Aksharantar/resolve/main/tel.zip -o training/data/aksharantar/tel.zip
training/.venv/bin/python training/train_word_language.py
PYTORCH_ENABLE_MPS_FALLBACK=1 training/.venv/bin/python training/train_asr.py --model openai/whisper-small --reevaluate
training/.venv/bin/python training/prepare_fleurs.py --train 0 --test 6 --languages bn_in,mr_in,ta_in,cmn_hans_cn,es_419,ar_eg --output fleurs-extra.jsonl
training/.venv/bin/python training/prepare_fleurs.py --train 0 --test 6 --languages fr_fr --output fleurs-french.jsonl
HF_HUB_OFFLINE=1 training/.venv/bin/python training/evaluate_nine_languages.py
training/.venv/bin/python training/build_telugu_lexicon.py
# With enough disk space and internet for the first download:
training/.venv/bin/python training/package_telugu_specialist.py --language te
training/.venv/bin/python training/package_telugu_specialist.py --language hi
training/.venv/bin/python training/package_telugu_specialist.py --language ta
training/.venv/bin/python training/package_telugu_specialist.py --language bn --model Rakib/whisper-small-bn-crblp
training/.venv/bin/python training/package_telugu_specialist.py --language mr --model anuragshas/whisper-small-mr
cd frontend && node scripts/check-telugu-onnx.mjs --all
node scripts/check-telugu-onnx.mjs --all --language=hi
node scripts/check-telugu-onnx.mjs --all --language=ta
node scripts/check-telugu-onnx.mjs --all --language=bn
node scripts/check-telugu-onnx.mjs --all --language=mr
```

The first base run predates model-specific result filenames; it is preserved as `asr-experiment.json`. New runs use `whisper-base-experiment.json`.

## Data and model attribution

- **FLEURS**, Google: https://huggingface.co/datasets/google/fleurs — CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Authors: Conneau et al., “FLEURS: Few-shot Learning Evaluation of Universal Representations of Speech,” 2022. We subset its recordings/transcripts for adaptation and evaluation. Not redistributed in the website.
- **Aksharantar**, AI4Bharat: https://huggingface.co/datasets/ai4bharat/Aksharantar — the dataset card specifies CC BY 4.0 for manually collected data and CC0 for mined/existing data. We use Hindi and Telugu romanized word lists for language identification and manually collected Telugu pairs in the reviewable suggestion lexicon. Attribute AI4Bharat and “Aksharantar: Open Indic-language Transliteration Datasets and Models for the Next Billion Users,” 2023. Exported classifier weights and lexicon are derived; original corpora are not bundled.
- **CMU Pronouncing Dictionary**, Carnegie Mellon University: https://github.com/cmusphinx/cmudict — English spellings from the cmudict 1.1.3 package. Full upstream license retained in `licenses/CMUdict.txt`.
- **Whisper**, OpenAI: https://github.com/openai/whisper — MIT. Browser ONNX artifacts: https://huggingface.co/Xenova/whisper-small and https://huggingface.co/Xenova/whisper-base. Training checkpoints use `openai/whisper-small` and `openai/whisper-base`.
- **Telugu specialist**, vasista22: https://huggingface.co/vasista22/whisper-telugu-small — Apache 2.0. Its ONNX export is stored locally under `frontend/public/models/fieldproof/whisper-telugu-small`; the 414 MB weight files are git-ignored and must be prepared before publishing the site. The site does not send speech to the model host.
- **Hindi specialist**, vasista22: https://huggingface.co/vasista22/whisper-hindi-small — Apache 2.0. Its ONNX export is an optional 414 MB local website pack with the same preparation rule.
- **Tamil specialist**, vasista22: https://huggingface.co/vasista22/whisper-tamil-small — Apache 2.0. Its ONNX export is an optional 414 MB local website pack.
- **Bengali specialist**, Rakib: https://huggingface.co/Rakib/whisper-small-bn-crblp — Apache 2.0. Its ONNX export is an optional 414 MB local website pack. The source model reports FLEURS use, so the six-clip check is not independent.
- **Marathi specialist**, anuragshas: https://huggingface.co/anuragshas/whisper-small-mr — Apache 2.0. Its ONNX export is an optional 414 MB local website pack. Its remaining WER is high.
- **Android Telugu, Bengali and Marathi GGML conversions**, bhaskaro: https://huggingface.co/bhaskaro/ainotes-whisper-telugu-q5_1, https://huggingface.co/bhaskaro/ainotes-whisper-bengali-q5_1, https://huggingface.co/bhaskaro/ainotes-whisper-marathi-q5_1 — Apache 2.0 for Telugu/Marathi and MIT for Bengali. The phone downloads and SHA-256-checks each in Setup.
- **Android Hindi and Tamil GGML conversions**, ukta-app: https://huggingface.co/ukta-app/indic-whisper-ggml — Apache 2.0. Optional 190 MB packs, verified by SHA-256 in Setup.
