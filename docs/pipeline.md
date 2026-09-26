# Pipeline reference

| Stage | Input | Output | Implementation |
| --- | --- | --- | --- |
| Preprocessing | raw string | surface tokens, scripts, categories | `preprocessing.py` |
| Language identification | tokens | language candidates and heuristic scores | `language_detection.py` |
| Code-switching | labeled tokens | boundary indexes and count | `code_switching.py` |
| Transliteration | labeled tokens | native form and gloss when known | `transliteration.py` |
| Normalization | tokens | additive canonical forms | `normalization.py` |
| Semantics | enriched tokens | conservative English meaning | `semantic_analysis.py` |
| Intent | tokens and raw text | label, score, evidence | `intent_detection.py` |
| Entities | tokens | typed spans by token index | `entity_extraction.py` |

The order matters: categories prevent acronyms from becoming fake languages; normalization keys help downstream rules; semantic output uses transliteration glosses; and the public schema is created only after all stages finish.
