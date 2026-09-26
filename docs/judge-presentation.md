# Two-minute judge presentation

**Problem (0:00–0:20).** People switch languages inside one sentence and spell regional words by ear. A fluent translation can hide a wrong word boundary or changed meaning.

**Speech demo (0:20–1:05).** Open the public `/transcribe/` page. Record or upload a short mixed-language clip with Auto detection. Show the machine original, editable transcript, word and sentence views, and a contextual spelling suggestion. Change the presentation from English to Original and another target language; the source stays intact.

**AI design (1:05–1:35).** Multilingual Whisper runs in a browser worker for speech. Optional language specialists can be selected when a language is known. A local Qwen model handles text presentation into other target languages. Models must be prepared while connected, then can be tested offline. Avoid claiming that Auto produces perfect token-level language labels.

**Explainability (1:35–1:55).** Open `/demo/` and show the separate Language Lab's token candidates, switch boundaries, normalization and JSON. Describe this as a deterministic, auditable baseline, not as the speech model's measured accuracy.

**Limit (1:55–2:00).** Accuracy depends on accent, noise, language pair and device. Compare output with a consented reference recording rather than illustrative copy.
