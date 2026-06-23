from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, Integer, String, DateTime, JSON

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisDB(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=utcnow)
    account_name = Column(String, nullable=False, default="Unnamed Account")
    transactions = Column(JSON, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    flags = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    total_transactions = Column(Integer, nullable=False)
    flagged_transactions = Column(Integer, nullable=False)
