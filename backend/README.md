# FastAPI Backend (Healthwell)

## Environment variables

Create a `.env.local` in the project root (repo root, not inside `backend/`) with:

```
OPENAI_API_KEY=YOUR_OPENAI_KEY (for AI)
VERCEL_URL=YOUR_VERCEL_URL (for CORS)
```
Ollama, flan, both served without keys

Backend also requires a Firebase Admin credential JSON placed at `backend/serviceAccountKey.json` for verifying ID tokens:

- Obtain from Firebase Console → Project settings → Service accounts → Generate new private key
- Save as `backend/serviceAccountKey.json` (not committed)

## Local setup

From `backend/`:

```bash
python -m venv .venv
./.venv/Scripts/activate  # Windows PowerShell
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend loads env from the repo root `.env.local`. If your working directory differs, this still works because we explicitly load it via `load_dotenv(".env.local")`.

### Service URL (local)

- Base URL: `http://127.0.0.1:8000` (equivalently `http://localhost:8000`)
- Example requests:
  - `POST http://127.0.0.1:8000/ai/generate`
  - `POST http://127.0.0.1:8000/flan/diagnose`
  - `POST http://127.0.0.1:8000/medLlama2/diagnose`
  - `POST http://127.0.0.1:8000/medgemma/diagnose`

### CORS

`backend/main.py` allows:
- http://localhost:3000
- https://your-app.vercel.app

Update these origins to your actual frontend domains if needed.

## Endpoints

- `POST /ai/generate` → wraps OpenAI to produce workout/recipe JSON
- `POST /flan/diagnose`, `POST /medLlama2/diagnose`, `POST /medgemma/diagnose`

All protected by Firebase ID token via `Authorization: Bearer <idToken>`.

### Request example

```
POST /ai/generate
{
  "prompt": "Full body 30 minutes, dumbbells only",
  "type": "workout"  // or "recipe"
}
```

## Deploy on a VM (e.g., Google Cloud VM)

1) SSH into VM, install Python 3.10+ and Git
2) Clone repo and `cd backend`
3) Create `.venv`, install `requirements.txt`
4) Set environment variables (e.g., in shell profile or a systemd unit):

```
export OPENAI_API_KEY=YOUR_OPENAI_KEY
```

5) Place `serviceAccountKey.json` under `backend/`
6) Run via a process manager (recommended):

```bash
pip install uvicorn[standard] gunicorn
gunicorn -k uvicorn.workers.UvicornWorker main:app -b 0.0.0.0:8000 --workers 2
```

7) Configure firewall to allow port 8000, or put behind Nginx with TLS and a domain.

### Service URL (hosted)

- If you expose port 8000 directly: `http://YOUR_VM_IP:8000`
- If using a domain/reverse proxy (recommended): `https://api.your-domain.com`
- Update your frontend `NEXT_PUBLIC_API_URL` accordingly.

## Notes / gotchas

- If you see `ModuleNotFoundError: openai`, install deps inside the same venv you use to run uvicorn.
- 401 responses usually mean missing/invalid Firebase ID token or mismatch between frontend Firebase project and backend service account.