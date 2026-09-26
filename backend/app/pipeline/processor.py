from app.models.response import (
    AnalysisResponse,
    LanguageCandidate,
    PipelineStage,
    TokenAnalysis,
)
from app.services.response_service import build_optional_response

from .code_switching import detect_code_switches
from .entity_extraction import extract_entities
from .intent_detection import detect_intent
from .language_detection import detect_languages, summarize_languages
from .normalization import normalize_phonetics
from .preprocessing import join_tokens, preprocess
from .semantic_analysis import normalized_meaning
from .transliteration import enrich_transliterations


class LanguagePipeline:
    """Orchestrates independent, explainable language-processing stages."""

    def analyze(self, text: str, *, include_response: bool = False) -> AnalysisResponse:
        tokens = preprocess(text)
        detect_languages(tokens)
        switches = detect_code_switches(tokens)
        enrich_transliterations(tokens)
        normalize_phonetics(tokens)
        meaning = normalized_meaning(tokens)
        intent = detect_intent(tokens, text)
        entities = extract_entities(tokens)
        detected, dominant, distribution = summarize_languages(tokens)

        token_models = [
            TokenAnalysis(
                index=token.index,
                text=token.text,
                language=token.language,
                language_name=token.language_name,
                script=token.script,
                category=token.category,
                transliterated=token.transliterated,
                native_form=token.native_form,
                normalized=token.normalized,
                meaning=token.meaning,
                heuristic_confidence=token.heuristic_confidence,
                candidates=[LanguageCandidate(**candidate) for candidate in token.candidates],
            )
            for token in tokens
        ]

        stages = [
            PipelineStage(key="preprocessing", label="Preprocessing", status="completed", summary=f"Preserved and tokenized {len(tokens)} items"),
            PipelineStage(key="language_detection", label="Language detection", status="completed", summary=f"Found {len(detected)} known languages"),
            PipelineStage(key="code_switching", label="Code-switch detection", status="completed", summary=f"Located {switches.switch_count} switch boundaries"),
            PipelineStage(key="transliteration", label="Transliteration", status="completed", summary=f"Mapped {sum(token.transliterated for token in tokens)} Latin-script words"),
            PipelineStage(key="normalization", label="Phonetic normalization", status="completed", summary=f"Normalized {sum(token.text != (token.normalized or token.text) for token in tokens)} variants"),
            PipelineStage(key="semantics", label="Semantic understanding", status="completed", summary="Produced a conservative normalized meaning"),
            PipelineStage(key="intent_entities", label="Intent & entities", status="completed", summary=f"Inferred {intent.label.lower()} and {len(entities)} entities"),
        ]

        caveats = [
            "Confidence values are heuristic scores, not calibrated model probabilities.",
            "Latin-script words outside the curated lexicon may remain unknown.",
        ]
        response = build_optional_response(tokens, intent.label) if include_response else None

        return AnalysisResponse(
            original_text=text,
            normalized_text=join_tokens(tokens, normalized=True),
            normalized_meaning=meaning,
            detected_languages=detected,
            dominant_language=dominant,
            language_distribution=distribution,
            code_switching=switches,
            tokens=token_models,
            intent=intent,
            entities=entities,
            pipeline=stages,
            response=response,
            caveats=caveats,
        )
