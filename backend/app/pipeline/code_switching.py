from app.models.response import CodeSwitching, SwitchPoint

from .types import WorkingToken


def detect_code_switches(tokens: list[WorkingToken]) -> CodeSwitching:
    points: list[SwitchPoint] = []
    previous: WorkingToken | None = None
    for token in tokens:
        if token.language not in {"en", "hi", "te"}:
            continue
        if previous and previous.language != token.language:
            points.append(
                SwitchPoint(
                    after_token_index=previous.index,
                    from_language=previous.language,
                    to_language=token.language,
                )
            )
        previous = token
    return CodeSwitching(
        detected=bool(points),
        switch_count=len(points),
        points=points,
    )
