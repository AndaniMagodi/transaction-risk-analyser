from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
from app.database import Base
from datetime import datetime
import uuid

class AnalysisDB(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    transactions = Column(JSON, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    flags = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    total_transactions = Column(Integer, nullable=False)
    flagged_transactions = Column(Integer, nullable=False)
