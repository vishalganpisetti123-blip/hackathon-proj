import pytest

from app.pipeline import LanguagePipeline


@pytest.fixture
def pipeline() -> LanguagePipeline:
    return LanguagePipeline()


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Hello what should I prepare", {"English"}),
        ("मुझे क्या करना चाहिए", {"Hindi"}),
        ("రేపు పరీక్ష ఉందా", {"Telugu"}),
        ("Kal meeting hai but I haven't prepared anything", {"English", "Hindi"}),
        ("Bro rep exam undha", {"English", "Telugu"}),
        (
            "Anna naku rep interview undhi but preparation em cheyalo samajh nahi aa raha",
            {"English", "Hindi", "Telugu"},
        ),
        ("రేపు DBMS exam ఉందా?", {"English", "Telugu"}),
        ("कल meeting है?", {"English", "Hindi"}),
    ],
)
def test_detected_language_sets(pipeline: LanguagePipeline, text: str, expected: set[str]) -> None:
    result = pipeline.analyze(text)
    assert expected.issubset(set(result.detected_languages))


def test_phonetic_variants_are_preserved_and_normalized(pipeline: LanguagePipeline) -> None:
    result = pipeline.analyze("broo raypu exm undhaa?")
    assert result.original_text == "broo raypu exm undhaa?"
    assert result.normalized_text == "bro repu exam undha?"
    assert {token.language for token in result.tokens} >= {"en", "te"}


def test_native_telugu_example_has_reviewed_meaning(pipeline: LanguagePipeline) -> None:
    result = pipeline.analyze("రేపు DBMS exam ఉందా?")
    assert result.normalized_meaning == "Is there a DBMS exam tomorrow?"


def test_unknown_word_is_not_forced_to_a_language(pipeline: LanguagePipeline) -> None:
    result = pipeline.analyze("zorpblat")
    assert result.tokens[0].language == "unknown"


def test_acronym_is_technical_not_a_language(pipeline: LanguagePipeline) -> None:
    result = pipeline.analyze("DBMS exam")
    assert result.tokens[0].language == "technical"
    assert result.tokens[0].category == "technical"


def test_numbers_urls_and_emojis_are_not_languages(pipeline: LanguagePipeline) -> None:
    result = pipeline.analyze("meet 10 https://example.com 🙂")
    categories = {token.category for token in result.tokens}
    assert {"number", "url", "emoji"}.issubset(categories)


def test_optional_response_is_opt_in(pipeline: LanguagePipeline) -> None:
    assert pipeline.analyze("What should I do?").response is None
    assert pipeline.analyze("What should I do?", include_response=True).response
