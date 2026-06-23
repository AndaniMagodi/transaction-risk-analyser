from typing import Literal

from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    id: int | str
    amount: float
    merchant: str
    date: str


class AnalyseRequest(BaseModel):
    account_name: str = Field(min_length=1)
    transactions: list[TransactionInput] = Field(min_length=1)


class FlagResult(BaseModel):
    transaction_id: str | int
    reason: str
    severity: Literal["Low", "Medium", "High", "Critical"]


class AnalysisResult(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_level: Literal["Low", "Medium", "High", "Critical"]
    summary: str
    flags: list[FlagResult]
    recommendations: list[str]
