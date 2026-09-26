from abc import ABC, abstractmethod


class AIService(ABC):
    """Provider boundary for future model-backed semantic analysis."""

    @abstractmethod
    async def analyze(self, text: str) -> dict:
        raise NotImplementedError


class DisabledAIService(AIService):
    async def analyze(self, text: str) -> dict:
        raise RuntimeError("No external AI provider is configured")
