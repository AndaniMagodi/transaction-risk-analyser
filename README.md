# Transaction Risk Analyser

An AI-powered tool that analyses financial transactions and flags potential risk indicators — unusually large amounts, duplicate entries, round-number patterns, and suspicious merchants — using an LLM (Groq/Llama 3.1).

Built to demonstrate practical use of AI APIs in a real, working application — from prompt design through to a persisted, queryable dashboard.

---

## What it does

- Upload a CSV of transactions (or paste raw JSON)
- An LLM analyses the batch and returns a structured risk assessment
- Every analysis is persisted to PostgreSQL with a stable ID
- A live dashboard tracks running stats across all analyses — total transactions processed, flagged counts, average risk score
- Analyses can be scoped by account/client name
- Flagged transactions are cross-referenced back to the original data and shown in a sortable table with merchant, amount, reason, and severity

---

## Architecture

**Single FastAPI service** serves both the API and the built React frontend (via `StaticFiles` + a catch-all route for client-side routing). One process, one deployment, one URL.

**Why a single AI integration point:** the value here isn't the number of API calls, it's the design around the call — structured prompting for reliable JSON output, schema validation of LLM responses, persistence of every result, and a dashboard that aggregates history meaningfully.

---

## OOP Design

`RiskAnalysisService` (in `analysis_service.py`) encapsulates all interaction with the Groq client — the API key, model selection, and prompt construction are private to the class. Routes call `risk_service.analyse_transactions()` without knowing anything about the underlying LLM provider, so swapping providers later only touches one file.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, PostgreSQL, Pydantic |
| AI | Groq API (Llama 3.1 8B Instant) |
| Frontend | React, TypeScript, MUI, TanStack Query |
| CSV Parsing | PapaParse |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze` | Analyse a batch of transactions, persist the result, return result with `id` |
| GET | `/api/accounts` | Distinct account/client names |
| GET | `/api/dashboard` | Aggregate stats (optional `?account=` filter) |
| GET | `/api/analyses` | Analysis history (optional `?account=` filter) |
| GET | `/api/analyses/{id}` | Full analysis detail including flags and transactions |
| GET | `/api/health` | Health check |

---

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL
- A free Groq API key (console.groq.com)

### Backend + Frontend (unified)

```bash
# 1. Build the frontend
cd frontend
npm install
npm run build
mkdir -p ../backend/static
cp -r dist/* ../backend/static/

# 2. Set up the backend
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Configure environment
cat > .env << 'ENV'
GROQ_API_KEY=your_key_here
DATABASE_URL=postgresql://user@localhost:5432/risk_analyser
ENV

# 4. Create the database
psql postgres -c "CREATE DATABASE risk_analyser;"

# 5. Run
uvicorn app.main:app --reload
```

Visit `http://localhost:8000` — the dashboard and API are served from the same origin.

### Frontend-only development (with hot reload)

```bash
cd frontend
npm install
npm run dev
```

In another terminal, run the backend on port 8000. The Vite dev server proxies API calls to `http://localhost:8000` automatically in development.

---

## CSV Format

```csv
id,amount,merchant,date
1,500,Shoprite,2026-06-15
2,50000,Unknown,2026-06-15
```

Each row must include `id`, `amount`, `merchant`, and `date`.

---

## Design Decisions

- **Single AI integration, designed properly** — structured output, Pydantic validation of LLM JSON, and persistence of every run.
- **Native ZAR amounts** — no currency conversion; this targets the South African market directly.
- **Groq over OpenAI/Anthropic** — chosen for free-tier accessibility while building; the `RiskAnalysisService` abstraction means switching providers is a single-file change.
- **Unified deployment** — FastAPI serves the built frontend directly, avoiding the complexity of two separate deployed services for what is fundamentally one small application.
- **Account scoping** — each analysis is tagged with an account/client name so dashboard stats and history can be filtered per client.
