# Local Language Lab API

FastAPI serves the explainable text-analysis pipeline used by `/analyze/` and `/demo/`. It exposes health, examples and analysis routes only. The browser speech studio runs its models locally and does not need this API for recording or transcription.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
.venv/bin/pytest -q tests
```

Run these commands from `backend/`. The API docs are at `http://127.0.0.1:8000/docs`. The service uses curated linguistic rules and data for explainable text analysis; it does not call a cloud model. The previous account and report endpoints are no longer registered. Any existing local database file is retained as data but is not used by the current API.
