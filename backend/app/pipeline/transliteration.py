from app.data.lexicons import HINDI_LATIN, NORMALIZATION_VARIANTS, TELUGU_LATIN

from .types import WorkingToken


def enrich_transliterations(tokens: list[WorkingToken]) -> list[WorkingToken]:
    """Attach curated native forms; this is lookup transliteration, not free-form generation."""
    for token in tokens:
        key = NORMALIZATION_VARIANTS.get(token.normalized_key, token.normalized_key)
        source = TELUGU_LATIN if token.language == "te" else HINDI_LATIN if token.language == "hi" else None
        if source and key in source and token.script == "latin":
            token.transliterated = True
            token.native_form, token.meaning = source[key]
    return tokens
