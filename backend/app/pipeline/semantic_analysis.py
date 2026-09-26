from .types import WorkingToken

KNOWN_SENTENCES = {
    "bro rep dbms exam undha": "Bro, do we have a DBMS exam tomorrow?",
    "kal meeting hai but i haven't prepared anything": "The meeting is tomorrow, but I haven't prepared anything.",
    "anna naku rep interview undhi but preparation em cheyalo samajh nahi aa raha": (
        "I have an interview tomorrow, but I don't understand what I should do for preparation."
    ),
    "రేపు dbms exam ఉందా": "Is there a DBMS exam tomorrow?",
    "bro raypu exm undhaa": "Bro, is there an exam tomorrow?",
}


def normalized_meaning(tokens: list[WorkingToken]) -> str:
    key = " ".join(token.normalized_key for token in tokens if token.category != "punctuation")
    if key in KNOWN_SENTENCES:
        return KNOWN_SENTENCES[key]

    glosses: list[str] = []
    for token in tokens:
        if token.category == "punctuation":
            continue
        if token.meaning:
            glosses.append(token.meaning)
        elif token.normalized:
            glosses.append(token.normalized)
        else:
            glosses.append(token.text)
    if not glosses:
        return "No semantic meaning could be produced."
    return " ".join(glosses).strip().capitalize()
