# Explaining the FieldProof Language Lab

This document describes the explainable typed-text pipeline. The public speech studio at `/transcribe/` is a separate local Whisper and Qwen workflow; see [transcriber behavior](docs/transcriber.md).

## 1. The problem

Real messages do not stay inside one language, dictionary, or writing system. A student may write Telugu or Hindi in Latin characters, insert English technical terms, shorten words, and switch language mid-sentence. Systems trained on formal monolingual text often misidentify or flatten that structure.

## 2. Three key terms

- **Code-switching:** changing languages inside one conversation or sentence: `Kal meeting hai but I haven't prepared`.
- **Transliteration:** representing sounds from one writing system in another: `repu` represents Telugu `రేపు`.
- **Phonetic spelling:** spelling by perceived sound, often inconsistently: `raypu`, `repuu`, and `repu` may express the same Telugu word.

## 3. What the system does

It preserves the message, tokenizes it, identifies scripts/categories/language candidates, locates transitions between known language tokens, enriches supported Latin forms with native script and meaning, normalizes known spelling variants, derives a conservative meaning, detects intent/entities, and packages every decision as JSON.

## 4. Complete pipeline

```text
raw input
  ↓ preprocessing.py          preserve + tokenize + script/category
  ↓ language_detection.py     script rules + lexicon candidates
  ↓ code_switching.py         compare adjacent known-language tokens
  ↓ transliteration.py        attach native form + gloss
  ↓ normalization.py          map known phonetic variants
  ↓ semantic_analysis.py      reviewed template or token gloss fallback
  ↓ intent_detection.py       evidence-backed intent rules
  ↓ entity_extraction.py      time/event/technical entities
  ↓ processor.py              validate and build response contract
```

## 5. What happens when Analyze is clicked?

`AnalysisWorkbench` sends the text to `POST /api/v1/analyze`. Pydantic validates it. `LanguagePipeline.analyze()` runs the stages in order. FastAPI serializes the result. React renders distribution bars, colored tokens, native forms, meaning, intent, entities, a trace, and collapsible JSON. A successful result is also saved locally.

## 6. Algorithms and why

- **Unicode block detection:** reliable for Devanagari and Telugu script, instant, and easy to explain.
- **Curated Latin lexicons:** transparent support for showcase transliterations without requiring a large download.
- **Phonetic variant dictionary:** deterministic handling of frequent demo variants.
- **Adjacent-language comparison:** a switch occurs only when consecutive known language tokens differ; acronyms, URLs, numbers, emoji, punctuation, and unknowns are skipped.
- **Rules for intent/entities:** small, testable evidence sets appropriate for a hackathon baseline.
- **Reviewed semantic templates:** meanings for the reviewed demo scenarios; unseen text receives a clearly limited gloss-based result.

These are heuristic techniques, not a trained universal language model. `heuristic_confidence` describes rule strength and is never called calibrated confidence.

## 7. Frontend versus backend

The Language Lab frontend owns interaction and explanation. The backend owns validation and text-analysis logic. They communicate using JSON over REST. The speech studio instead runs its models in the browser and does not send audio to this API.

## 8. Example request

```json
{
  "text": "Bro rep DBMS exam undha?",
  "include_response": false
}
```

## 9. Example response excerpt

```json
{
  "detected_languages": ["English", "Telugu"],
  "code_switching": { "detected": true, "switch_count": 3 },
  "tokens": [
    {
      "text": "rep",
      "language": "te",
      "script": "latin",
      "transliterated": true,
      "native_form": "రేపు",
      "normalized": "repu",
      "meaning": "tomorrow",
      "heuristic_confidence": 0.9
    }
  ],
  "normalized_meaning": "Bro, do we have a DBMS exam tomorrow?"
}
```

## 10. Language, switches, transliteration, and normalization

`language_detection.py` treats native scripts as strong signals, then checks normalized Latin keys against language lexicons. Multiple matches become `ambiguous`; no match becomes `unknown`. `code_switching.py` walks only known-language tokens and records boundary indexes. `transliteration.py` adds native spelling and meaning only for supported entries. `normalization.py` adds a canonical form while leaving `text` and `original_text` untouched.

## 11. Semantic understanding, intent, and entities

The demo examples have reviewed English meanings. For unseen text, the baseline combines known glosses and original words rather than inventing a fluent interpretation. Intent rules retain evidence, such as an interrogative or help phrase. Entity rules extract supported events, time references, and technical terms with token indexes.

## 12. Limitations

Token meaning depends on context; transliteration has no single standard; `kal` may mean yesterday or tomorrow; dialects vary; and the small lexicon does not cover ordinary conversation. A dictionary cannot generalize like a trained contextual model, while a large model can be less predictable and harder to explain.

## 13. Future improvements

Create an annotated code-switched corpus, train a contextual token classifier, add character-level phonetic similarity and grapheme conversion, use sequence models for phrase boundaries, calibrate confidence, add feedback-based lexicon review, and use the `AIService` boundary to enhance only low-confidence semantic cases.
