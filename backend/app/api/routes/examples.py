from fastapi import APIRouter

from app.data.examples import EXAMPLES

router = APIRouter(tags=["examples"])


@router.get("/examples")
def examples() -> list[dict[str, str]]:
    return EXAMPLES
