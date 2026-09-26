from app.data.lexicons import NORMALIZATION_VARIANTS

from .types import WorkingToken


def normalize_phonetics(tokens: list[WorkingToken]) -> list[WorkingToken]:
    for token in tokens:
        canonical = NORMALIZATION_VARIANTS.get(token.normalized_key)
        token.normalized = canonical if canonical else token.text
    return tokens
