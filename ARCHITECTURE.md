# Architecture

```text
Speech studio (Next.js static export)
  microphone / uploaded audio
    -> local audio decoding at 16 kHz
    -> browser worker with multilingual Whisper or selected Indic speech pack
    -> editable original transcript and word/sentence views
    -> local Whisper English presentation or local Qwen translation
    -> local transcript storage and text export

Language Lab (Next.js + loopback FastAPI)
  typed mixed-language text
    -> preprocessing -> token language candidates -> switch boundaries
    -> transliteration -> normalization -> meaning -> intent/entities
    -> inspectable JSON and browser-only history
```

The speech studio needs HTTPS or localhost for the microphone and service worker. Model artifacts are downloaded when prepared, cached by the browser, and run locally thereafter. The website shell can be installed for offline use. Browser cache retention is not guaranteed, so offline use is verified on the target device. The Language Lab uses a local FastAPI process and does not call a cloud provider; it is available offline when that process is running on the same laptop.

The browser's WebLLM translation model and Whisper speech model use separate runtimes in one worker. Loading one releases the other to reduce peak memory use. Source text, corrected text and translated text are stored separately. Heuristic language tags and spelling suggestions are review aids, not calibrated confidence scores.

The native prototype is separate from the website. Its current screens are Transcribe and Models & setup. Neither the website nor the API exposes user accounts, reporting or emergency endpoints.
