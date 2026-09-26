import re
import unicodedata

from .types import WorkingToken

URL_PATTERN = re.compile(r"(?:https?://|www\.)[^\s]+", flags=re.IGNORECASE)


def _script_for(text: str) -> str:
    scripts: set[str] = set()
    for char in text:
        point = ord(char)
        if 0x0900 <= point <= 0x097F:
            scripts.add("devanagari")
        elif 0x0C00 <= point <= 0x0C7F:
            scripts.add("telugu")
        elif char.isascii() and char.isalpha():
            scripts.add("latin")
    if len(scripts) > 1:
        return "mixed"
    return next(iter(scripts), "common")


def _category_for(text: str) -> str:
    if text.startswith(("http://", "https://", "www.")):
        return "url"
    if text.replace(".", "", 1).isdigit():
        return "number"
    if all(unicodedata.category(char).startswith("P") for char in text):
        return "punctuation"
    if any(unicodedata.category(char) in {"So", "Sk"} for char in text):
        return "emoji"
    return "word"


def _tokenize(text: str) -> list[str]:
    """Keep Unicode combining marks with their base character (important for Indic scripts)."""
    pieces: list[str] = []
    current = ""
    index = 0

    def flush() -> None:
        nonlocal current
        if current:
            pieces.append(current)
            current = ""

    while index < len(text):
        url = URL_PATTERN.match(text, index)
        if url:
            flush()
            pieces.append(url.group(0))
            index = url.end()
            continue

        char = text[index]
        category = unicodedata.category(char)
        is_word_part = category[0] in {"L", "N", "M"} or char == "_"
        is_inner_apostrophe = char in {"'", "’"} and bool(current)
        if is_word_part or is_inner_apostrophe:
            current += char
        elif char.isspace():
            flush()
        else:
            flush()
            pieces.append(char)
        index += 1
    flush()
    return pieces


def preprocess(text: str) -> list[WorkingToken]:
    """Tokenize without changing the original surface form."""
    return [
        WorkingToken(
            index=index,
            text=piece,
            normalized_key=piece.casefold().strip(".,!?;:\"'()[]{}"),
            script=_script_for(piece),
            category=_category_for(piece),
        )
        for index, piece in enumerate(_tokenize(text))
    ]


def join_tokens(tokens: list[WorkingToken], *, normalized: bool = False) -> str:
    output = ""
    for token in tokens:
        value = token.normalized if normalized and token.normalized else token.text
        if output and token.category != "punctuation":
            output += " "
        output += value
    return output
