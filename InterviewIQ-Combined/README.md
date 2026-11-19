# InterviewIQ

InterviewIQ is an AI-powered mock interview application with a React + Vite frontend and a FastAPI backend. It generates role- and level-specific interview questions, evaluates candidate answers with structured feedback, and stores user-specific interview history and analytics in SQLite.

## Repository layout

- `frontend/` — React 19, Vite, Tailwind CSS and React Router application.
- `backend/` — FastAPI API, Gemini-powered question/evaluation engine, SQLite persistence and authentication.
- `backend/legacy_streamlit_app.py` — retained earlier Streamlit prototype; it is not part of the React/FastAPI runtime.

## Requirements

- Node.js and npm
- Python 3.10+
- A Google Gemini API key

## Run the backend

Open a terminal:

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env`, then set `GEMINI_API_KEY` and a long random `INTERVIEWIQ_SECRET_KEY`. Never commit `.env`.

Start FastAPI:

```bash
uvicorn api:app --reload
```

API root: `http://127.0.0.1:8000/`  
Interactive API docs: `http://127.0.0.1:8000/docs`

## Run the frontend

In another terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env.local` if you need a non-default API URL. Start Vite:

```bash
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## API configuration

The frontend reads `VITE_API_URL`; by default it uses `http://127.0.0.1:8000`. The FastAPI CORS allowlist currently permits `http://localhost:5173` and `http://127.0.0.1:5173`.

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/generate-question`
- `POST /api/evaluate-answer`
- `GET /api/history`
- `GET /api/history/{interview_id}`
- `GET /api/analytics`

## Security notes

- Keep Gemini API keys and JWT signing secrets in local environment variables.
- SQLite database files are created under `backend/data/` and are ignored by Git.
- Do not commit real user data, tokens, credentials, `.env` files, virtual environments or `node_modules`.

## Current implementation notes

The frontend and backend sources were supplied as separate ZIP archives and combined into this repository layout. The frontend's API base URL has been made configurable through `VITE_API_URL`. The earlier Streamlit `app.py` is retained as `legacy_streamlit_app.py` for reference; the active backend entry point is `backend/api.py`.

Build, integration and end-to-end tests still need to be run in the target environment before treating this package as production-ready.
