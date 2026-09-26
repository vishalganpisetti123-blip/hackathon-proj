from app.pipeline.types import WorkingToken


def build_optional_response(tokens: list[WorkingToken], intent: str) -> str:
    languages = {token.language for token in tokens}
    if intent == "Advice seeking" and "te" in languages:
        return "Tension padaku — first role requirements list chesi, key topics revise cheyyi, then one mock interview practice cheddam."
    if intent == "Advice seeking" and "hi" in languages:
        return "Tension mat lo—pehle key topics list karo, phir ek short practice plan banaate hain."
    if intent == "Question":
        return "I understood this as a question. I’d verify the event details with the relevant person or schedule."
    return "I understood the message. The analysis above shows how each part was interpreted."
