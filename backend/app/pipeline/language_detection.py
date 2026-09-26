import re
from collections import Counter

from app.data.lexicons import (
    ENGLISH,
    HINDI_LATIN,
    NORMALIZATION_VARIANTS,
    TECHNICAL_TERMS,
    TELUGU_LATIN,
)

from .types import WorkingToken

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ambiguous": "Ambiguous",
    "unknown": "Unknown",
    "technical": "Technical / entity",
}


def _candidate(language: str, score: float) -> dict[str, str | float]:
    return {"language": language, "heuristic_score": score}


def detect_languages(tokens: list[WorkingToken]) -> list[WorkingToken]:
    for token in tokens:
        key = NORMALIZATION_VARIANTS.get(token.normalized_key, token.normalized_key)

        if token.category in {"url", "number", "emoji", "punctuation"}:
            token.language = "unknown"
            token.language_name = token.category.title()
            continue
        if key in TECHNICAL_TERMS or (
            token.text.isupper() and len(token.text) > 1 and re.search(r"[A-Z]", token.text)
        ):
            token.category = "technical"
            token.language = "technical"
            token.language_name = LANGUAGE_NAMES["technical"]
            continue
        if token.script == "devanagari":
            token.language = "hi"
            token.language_name = LANGUAGE_NAMES["hi"]
            token.heuristic_confidence = 0.99
            token.candidates = [_candidate("hi", 0.99)]
            continue
        if token.script == "telugu":
            token.language = "te"
            token.language_name = LANGUAGE_NAMES["te"]
            token.heuristic_confidence = 0.99
            token.candidates = [_candidate("te", 0.99)]
            continue

        matches: list[tuple[str, float]] = []
        if key in TELUGU_LATIN:
            matches.append(("te", 0.9 if key == token.normalized_key else 0.78))
        if key in HINDI_LATIN:
            matches.append(("hi", 0.9 if key == token.normalized_key else 0.78))
        if key in ENGLISH:
            matches.append(("en", 0.9 if key == token.normalized_key else 0.78))

        if len(matches) == 1:
            token.language, token.heuristic_confidence = matches[0]
            token.language_name = LANGUAGE_NAMES[token.language]
            token.candidates = [_candidate(*matches[0])]
        elif len(matches) > 1:
            token.language = "ambiguous"
            token.language_name = LANGUAGE_NAMES["ambiguous"]
            token.heuristic_confidence = max(score for _, score in matches)
            token.candidates = [_candidate(language, score) for language, score in matches]
        elif token.script == "latin":
            token.language = "unknown"
            token.language_name = LANGUAGE_NAMES["unknown"]
            token.category = "unknown"
            token.heuristic_confidence = 0.25
        else:
            token.language = "unknown"
            token.language_name = LANGUAGE_NAMES["unknown"]
    return tokens


def summarize_languages(tokens: list[WorkingToken]) -> tuple[list[str], str, dict[str, float]]:
    counts = Counter(
        token.language for token in tokens if token.language in {"en", "hi", "te"}
    )
    if not counts:
        return [], "Unknown", {}

    total = sum(counts.values())
    distribution = {
        LANGUAGE_NAMES[code]: round(count / total, 3)
        for code, count in counts.most_common()
    }
    detected = list(distribution)
    return detected, detected[0], distribution
