# Measured training results

The deployed word-language classifier was trained on 54,000 words and evaluated on 3,000 disjoint words: **80.0% top-choice accuracy**. Thresholding keeps 79.3% of words at 86.8% accuracy on that accepted subset. These are isolated-word classification measurements, not speech recognition scores.

Whisper small was adapted with 90 FLEURS training clips for 120 updates and tested on 18 held-out clips. The controlled evaluation uses identical decoding configuration for baseline and candidate.

| Language | Pretrained WER | Adapted WER | Clips |
|---|---:|---:|---:|
| English | 7.3% | 7.3% | 6 |
| Hindi | 56.4% | 60.4% | 6 |
| Telugu | 165.4% | 100.0% | 6 |

**Do not deploy this adapted checkpoint.** English did not improve, Hindi regressed, and Telugu remains unusable on this tiny sample despite fewer insertion errors. Word error rate can exceed 100%. These recordings are monolingual read speech; they do not establish mixed-language or outdoor performance.

The website and phone now offer ten spoken-language choices: Hindi, Bengali, Marathi, Telugu, Tamil, English, Mandarin, Spanish, Arabic and French. These cover India's five leading mother tongues and both Arabic and French, whose worldwide fifth-place ranking varies by source and counting method. A language choice supplies an ASR decoding hint; it does not mean the generic model has been retrained. The five Indian languages have optional local specialist packs. Auto and multilingual Whisper small remain available for code switching.

The generic Whisper small baseline below used six clean FLEURS test recordings per language with a fixed language hint. This is a diagnostic sample, not field accuracy. WER can exceed 100% because insertions count; word segmentation also makes Mandarin WER especially hard to compare with space-delimited languages.

| Language | Generic small WER | Clips |
|---|---:|---:|
| English | 7.3% | 6 |
| Hindi | 56.4% | 6 |
| Telugu | 165.4% | 6 |
| Bengali | 103.7% | 6 |
| Marathi | 124.5% | 6 |
| Tamil | 62.0% | 6 |
| Mandarin | 93.3% | 6 |
| Spanish | 6.3% | 6 |
| Arabic | 20.3% | 6 |
| French | 16.7% | 6 |

The third-party `vasista22/whisper-telugu-small` checkpoint, converted locally with Optimum and dynamically quantized for ONNX, produced **9.9% WER on those same six Telugu clips in the Transformers.js CPU runtime**. The generic comparison was 165.4%. This is a small benchmark-family comparison: the specialist's model card reports FLEURS in its own evaluation, so these clips are **not an independent release test**. The earlier PyTorch specialist result was 19.8% WER with a 192-token generation cap, which truncated one long clip; do not interpret the difference as a quantization gain. The browser loaded the quantized model and transcribed a public Telugu sample end to end. Real spontaneous, noisy, romanized, and code-switched speech remains unmeasured.

The third-party `vasista22/whisper-hindi-small` produced **12.1% WER** in the quantized Transformers.js CPU runtime on six Hindi clips, versus **56.4%** for the generic Python Whisper small baseline. Its PyTorch result was 11.4%. The browser loaded the Hindi pack successfully; spontaneous and code-switched Hindi remain unmeasured.

The additional 8-bit ONNX specialists were checked with the same six FLEURS clips in the Transformers.js CPU runtime:

| Language | Generic Python Whisper small WER | Specialist browser-runtime WER | Source checkpoint |
|---|---:|---:|---|
| Tamil | 62.0% | 26.6% | `vasista22/whisper-tamil-small` |
| Bengali | 103.7% | 29.4% | `Rakib/whisper-small-bn-crblp` |
| Marathi | 124.5% | 52.1% | `anuragshas/whisper-small-mr` |

These baseline and candidate runs use different runtimes, so the differences are directional model-selection diagnostics, not controlled improvement estimates. The Bengali source model reports FLEURS among its development datasets, and all selections used this tiny benchmark family. A second Marathi checkpoint, `steja/whisper-small-marathi`, measured 54.3% WER in Python versus 53.2% for the selected checkpoint; Marathi remains weak even with a specialist. The Mandarin candidate `Jingmiao/whisper-small-chinese_base` emitted character-spaced text and only a small character-error change after whitespace removal (23.6% versus 24.4% for generic), so it was **not deployed**.

For Android, the optional `bhaskaro/ainotes-whisper-telugu-q5_1` pack measured **18.5% WER** on six Telugu FLEURS clips through whisper.cpp with `no_timestamps`, versus **153.1%** for the current generic Q5 phone model with the same runtime and settings. The native binding was patched to expose `noTimestamps` and the Android release built successfully, but the APK and model have **not** been tested together on a physical phone. The specialist is only used when installed and Telugu is selected.

The same whisper.cpp settings were used to compare additional optional phone packs with the generic Q5 model. The phone selects a pack only when it has been installed and the matching language is chosen; Auto keeps the multilingual model.

| Language | Generic phone WER | Specialist phone WER | Specialist source |
|---|---:|---:|---|
| Hindi | 53.0% | 10.7% | `ukta-app/indic-whisper-ggml` |
| Bengali | 112.8% | 38.5% | `bhaskaro/ainotes-whisper-bengali-q5_1` |
| Marathi | 103.2% | 58.5% | `bhaskaro/ainotes-whisper-marathi-q5_1` |
| Telugu | 153.1% | 18.5% | `bhaskaro/ainotes-whisper-telugu-q5_1` |
| Tamil | 64.6% | 26.6% | `ukta-app/indic-whisper-ggml` |

These are six clean read-speech clips per language. Bengali and Marathi still require close editing; a lower WER does not make them field-ready. No physical phone, spontaneous speech, noisy outdoor speech, or mixed-language recording has been measured.

See `results/nine-language-baseline.json`, `results/french-generic-baseline.json`, the language-specific specialist results, `results/*-quantized-browser-runtime.jsonl`, and `results/phone-*.json` for references and raw predictions. The optional spelling suggestion for `was tundi → vastundi` is based on a manually collected Telugu romanization lexicon; it does **not** silently change the original ASR text. There was no user recording of this error, so that exact acoustic failure is unverified.

The trained word classifier is bundled at `frontend/public/models/word-language.json`. ASR candidate checkpoints stay local under `training/checkpoints/` and are git-ignored. See `README.md` for reproducibility, licenses and limitations.
