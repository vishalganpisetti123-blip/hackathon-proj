from dataclasses import dataclass, field


@dataclass
class WorkingToken:
    index: int
    text: str
    normalized_key: str
    script: str
    category: str = "word"
    language: str = "unknown"
    language_name: str = "Unknown"
    transliterated: bool = False
    native_form: str | None = None
    normalized: str | None = None
    meaning: str | None = None
    heuristic_confidence: float | None = None
    candidates: list[dict[str, str | float]] = field(default_factory=list)
