from typing import Literal

from pydantic import BaseModel, Field


LanguageCode = Literal["en", "hi", "te", "ambiguous", "unknown", "technical"]


class LanguageCandidate(BaseModel):
    language: LanguageCode
    heuristic_score: float = Field(ge=0, le=1)


class TokenAnalysis(BaseModel):
    index: int
    text: str
    language: LanguageCode
    language_name: str
    script: Literal["latin", "devanagari", "telugu", "common", "mixed"]
    category: Literal["word", "technical", "url", "number", "emoji", "punctuation", "unknown"]
    transliterated: bool = False
    native_form: str | None = None
    normalized: str | None = None
    meaning: str | None = None
    heuristic_confidence: float | None = Field(default=None, ge=0, le=1)
    candidates: list[LanguageCandidate] = Field(default_factory=list)


class SwitchPoint(BaseModel):
    after_token_index: int
    from_language: str
    to_language: str


class CodeSwitching(BaseModel):
    detected: bool
    switch_count: int
    points: list[SwitchPoint]


class IntentResult(BaseModel):
    label: str
    heuristic_confidence: float = Field(ge=0, le=1)
    evidence: list[str]


class Entity(BaseModel):
    text: str
    type: str
    normalized_value: str | None = None
    token_indexes: list[int]


class PipelineStage(BaseModel):
    key: str
    label: str
    status: Literal["completed", "degraded", "skipped"]
    summary: str


class AnalysisResponse(BaseModel):
    schema_version: str = "1.0"
    original_text: str
    normalized_text: str
    normalized_meaning: str
    detected_languages: list[str]
    dominant_language: str
    language_distribution: dict[str, float]
    code_switching: CodeSwitching
    tokens: list[TokenAnalysis]
    intent: IntentResult
    entities: list[Entity]
    pipeline: list[PipelineStage]
    response: str | None = None
    caveats: list[str]
