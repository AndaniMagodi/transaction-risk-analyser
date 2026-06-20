from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.analysis import router as analysis_router
from app.database import engine
from app.models import db_models

db_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Transaction Risk Analyser",
    description="AI-powered transaction risk analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)

@app.get("/")
def root():
    return {"message": "Transaction Risk Analyser API is running"}
