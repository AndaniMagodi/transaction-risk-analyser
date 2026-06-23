from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routes.analysis import router as analysis_router
from app.database import engine
from app.models import db_models

db_models.Base.metadata.create_all(bind=engine)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(
    title="Transaction Risk Analyser",
    description="AI-powered transaction risk analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)

if STATIC_DIR.is_dir() and (STATIC_DIR / "index.html").is_file():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = STATIC_DIR / path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
else:

    @app.get("/")
    def root():
        return {
            "message": "Transaction Risk Analyser API is running",
            "hint": "Build the frontend and copy dist/* to backend/static/ to serve the UI",
        }
