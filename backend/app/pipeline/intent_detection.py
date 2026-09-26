from app.models.response import IntentResult

from .types import WorkingToken


def detect_intent(tokens: list[WorkingToken], original_text: str) -> IntentResult:
    keys = {token.normalized_key for token in tokens}
    evidence: list[str] = []

    advice_terms = {"cheyalo", "karu", "should", "help", "samajh"}
    if keys & advice_terms:
        evidence.append("Contains a help/advice phrase")
        if {"interview", "preparation"} & keys:
            evidence.append("Mentions preparation for an event")
        return IntentResult(label="Advice seeking", heuristic_confidence=0.84, evidence=evidence)

    question_terms = {"kya", "enti", "undha", "what", "when", "where", "why", "how"}
    if "?" in original_text or keys & question_terms:
        evidence.append("Contains a question mark or interrogative expression")
        return IntentResult(label="Question", heuristic_confidence=0.82, evidence=evidence)

    if keys & {"hello", "hi", "hey", "namaste", "namaskaram"}:
        evidence.append("Contains a greeting expression")
        return IntentResult(label="Greeting", heuristic_confidence=0.86, evidence=evidence)

    if keys & {"please", "send", "give", "show", "tell"}:
        evidence.append("Contains a request marker")
        return IntentResult(label="Request", heuristic_confidence=0.72, evidence=evidence)

    return IntentResult(
        label="Other",
        heuristic_confidence=0.4,
        evidence=["No strong rule-based intent signal was found"],
    )
