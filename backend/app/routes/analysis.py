from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.services.analysis_service import risk_service
from app.models.db_models import AnalysisDB
from app.database import get_db
import uuid
from datetime import datetime

router = APIRouter(prefix="/api", tags=["analysis"])

class TransactionPayload(BaseModel):
    account_name: str
    transactions: list[dict[str, Any]]

@router.post("/analyze")
def analyse(payload: TransactionPayload, db: Session = Depends(get_db)):
    try:
        result = risk_service.analyse_transactions(payload.transactions)

        analysis = AnalysisDB(
            id=str(uuid.uuid4()),
            created_at=datetime.utcnow(),
            account_name=payload.account_name,
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

@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    rows = db.query(AnalysisDB.account_name).distinct().all()
    return sorted([r[0] for r in rows])

@router.get("/dashboard")
def get_dashboard(account: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(AnalysisDB)
    if account:
        query = query.filter(AnalysisDB.account_name == account)
    analyses = query.order_by(AnalysisDB.created_at.desc()).all()

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
        "total_transactions": sum(a.total_transactions for a in analyses),
        "flagged_transactions": sum(a.flagged_transactions for a in analyses),
        "average_risk_score": round(sum(a.risk_score for a in analyses) / len(analyses)),
        "risk_level": latest.risk_level
    }

@router.get("/transactions")
def get_transactions(account: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(AnalysisDB)
    if account:
        query = query.filter(AnalysisDB.account_name == account)
    latest = query.order_by(AnalysisDB.created_at.desc()).first()
    if not latest:
        return []
    return latest.transactions

@router.get("/analyses")
def get_analyses(account: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(AnalysisDB)
    if account:
        query = query.filter(AnalysisDB.account_name == account)
    analyses = query.order_by(AnalysisDB.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "created_at": a.created_at.isoformat(),
            "account_name": a.account_name,
            "risk_score": a.risk_score,
            "risk_level": a.risk_level,
            "total_transactions": a.total_transactions,
            "flagged_transactions": a.flagged_transactions,
            "summary": a.summary
        }
        for a in analyses
    ]

@router.get("/analyses/{analysis_id}")
def get_analysis_detail(analysis_id: str, db: Session = Depends(get_db)):
    analysis = db.query(AnalysisDB).filter(AnalysisDB.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "id": analysis.id,
        "created_at": analysis.created_at.isoformat(),
        "account_name": analysis.account_name,
        "risk_score": analysis.risk_score,
        "risk_level": analysis.risk_level,
        "summary": analysis.summary,
        "flags": analysis.flags,
        "recommendations": analysis.recommendations,
        "transactions": analysis.transactions,
        "total_transactions": analysis.total_transactions,
        "flagged_transactions": analysis.flagged_transactions
    }

@router.get("/health")
def health():
    return {"status": "ok", "model": "llama-3.1-8b-instant"}
