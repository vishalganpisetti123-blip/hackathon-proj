# Limitations and responsible claims

- This prototype is not a universal transliterator or production language identifier.
- `heuristic_confidence` values encode rule strength, not calibrated probability.
- Distinct scripts are easier to identify than Latin transliterations.
- Unknown and ambiguous are valid results, not pipeline errors.
- Some terms belong to multiple languages or have context-dependent meaning.
- The semantic fallback is intentionally conservative.
- Local history is not synced, authenticated, or encrypted separately from browser storage.
- The optional response is deterministic and secondary to analysis.

Production evaluation needs a consented, dialect-balanced, code-switched dataset and metrics at token, switch-boundary, intent, and entity levels.
