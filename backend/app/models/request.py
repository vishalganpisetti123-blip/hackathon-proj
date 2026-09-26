from pydantic import BaseModel, Field, field_validator


class AnalysisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    include_response: bool = False

    @field_validator("text")
    @classmethod
    def reject_blank_input(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must contain at least one visible character")
        return value
