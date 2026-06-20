from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any
from sqlalchemy.orm import Session
from app.services.analysis_service import risk_service
from app.models.db_models import AnalysisDB
from app.database import get_db
import uuid
from datetime import datetime

router = APIRouter(prefix="/api", tags=["analysis"])

class TransactionPayload(BaseModel):
    transactions: list[dict[str, Any]]

@router.post("/analyze")
def analyse(payload: TransactionPayload, db: Session = Depends(get_db)):
    try:
        result = risk_service.analyse_transactions(payload.transactions)

        analysis = AnalysisDB(
            id=str(uuid.uuid4()),
            created_at=datetime.utcnow(),
            transactions=payload.transactions,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            summary=result["summary"],
            flags=result["flags"],
            recommendations=result["recommendations"],
            total_transactions=len(payload.transactions),
            flagged_transactions=len(result["flags"])
        )
        db.add(analysis)
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    analyses = db.query(AnalysisDB).order_by(AnalysisDB.created_at.desc()).all()
    if not analyses:
        return {
            "total_analyses": 0,
            "total_transactions": 0,
            "flagged_transactions": 0,
            "average_risk_score": 0,
            "risk_level": "Low"
        }
    latest = analyses[0]
    return {
        "total_analyses": len(analyses),
        "total_transactions": latest.total_transactions,
        "flagged_transactions": latest.flagged_transactions,
        "average_risk_score": round(sum(a.risk_score for a in analyses) / len(analyses)),
        "risk_level": latest.risk_level
    }

@router.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    latest = db.query(AnalysisDB).order_by(AnalysisDB.created_at.desc()).first()
    if not latest:
        return []
    return latest.transactions

@router.get("/analyses")
def get_analyses(db: Session = Depends(get_db)):
    analyses = db.query(AnalysisDB).order_by(AnalysisDB.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "created_at": a.created_at.isoformat(),
            "risk_score": a.risk_score,
            "risk_level": a.risk_level,
            "total_transactions": a.total_transactions,
            "flagged_transactions": a.flagged_transactions,
            "summary": a.summary
        }
        for a in analyses
    ]

@router.get("/health")
def health():
    return {"status": "ok", "model": "llama-3.1-8b-instant"}
