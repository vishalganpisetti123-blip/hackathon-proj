from app.models.response import Entity

from .types import WorkingToken


def extract_entities(tokens: list[WorkingToken]) -> list[Entity]:
    entities: list[Entity] = []
    for token in tokens:
        key = token.normalized_key
        if token.category == "technical":
            entities.append(
                Entity(text=token.text, type="Technical term", token_indexes=[token.index])
            )
        elif key in {"exam", "interview", "meeting"}:
            entities.append(Entity(text=token.text, type="Event", token_indexes=[token.index]))
        elif key in {"repu", "rep", "raypu", "kal", "tomorrow", "today", "aaj", "ivala"}:
            meaning = token.meaning or ("tomorrow" if key != "kal" else "tomorrow / yesterday")
            entities.append(
                Entity(
                    text=token.text,
                    type="Time reference",
                    normalized_value=meaning,
                    token_indexes=[token.index],
                )
            )
    return entities
