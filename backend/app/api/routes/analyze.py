from fastapi import APIRouter, HTTPException

from app.models import AnalysisRequest, AnalysisResponse
from app.pipeline import LanguagePipeline

router = APIRouter(tags=["analysis"])
pipeline = LanguagePipeline()


@router.post("/analyze", response_model=AnalysisResponse)
def analyze(request: AnalysisRequest) -> AnalysisResponse:
    try:
        return pipeline.analyze(request.text, include_response=request.include_response)
    except Exception as exc:
        # Log the exception in a production deployment; never expose internals here.
        raise HTTPException(status_code=500, detail="The language pipeline could not analyze this text") from exc
