# FieldProof — code-switching and spelling by ear

FieldProof is an AI/ML hackathon prototype for natural multilingual speech. The website opens directly to a public transcriber: record or upload audio, let a local Whisper model detect the spoken language, review the original words and word boundaries, and present the transcript in English by default or another selected language. The original and the presentation stay separate. A second Language Lab shows an explainable text pipeline for code-switching, transliteration, normalization, intent and entities.

The active product has no worker accounts, supervisor dashboard, incident capture, emergency flow, or report delivery. An earlier local SQLite database may still exist on a development machine; the application no longer exposes its endpoints. It is intentionally not deleted by this change.

## Run the website

Requirements: Node 20.9+ and Python 3. The static website and FastAPI language lab run locally. The browser speech and translation models download once when prepared; after that, supported browsers can run them locally if the caches remain available.

```sh
backend/.venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
npm --prefix frontend install
npm --prefix frontend run build
npm --prefix frontend start
```

Open `http://127.0.0.1:3000/transcribe/` for speech or `/analyze/` for the language lab. The transcriber does not require the API. The language lab calls FastAPI on the laptop. For an iPhone on the same Wi-Fi, follow [the local HTTPS instructions](frontend/README.md).

## Deploy on Vercel

The repository root contains `vercel.json` and a Python entry point at `api/index.py`. Import the repository into Vercel with the **root directory set to the repository root**. Vercel builds the static Next.js site from `frontend/` and serves the Language Lab through its Python function at `/api/v1/*`. The production site uses HTTPS, so browsers can request microphone access.

The hosted build offers multilingual Whisper small and base. The five locally exported Indic specialist weight packages are excluded from Git and Vercel because each is about 400 MB. They remain available in a local installation that has those files. Browser speech and translation models still require an initial download before offline use; use **Prepare offline website** and **Download & prepare model**, then test offline on the target device. The Language Lab API needs connectivity to the deployed site.

## AI features

- Ten spoken languages plus Auto: Hindi, Bengali, Marathi, Telugu, Tamil, English, Mandarin, Spanish, Arabic and French. Auto uses multilingual Whisper; single-language Indic specialists are optional.
- Local speech transcription, audio replay, editable original text, sentence and word views, and contextual spelling suggestions. Suggestions are review aids, not silent replacements.
- English presentation by default, with an original-language option and other target languages. Translation failure leaves the original intact.
- Local saved sessions and text export. Prepare the website service worker and models while connected, then test offline on the target device. Browser storage can be evicted.
- Language Lab: a deterministic, explainable text pipeline, with token labels, switch boundaries, transliteration, normalization, meaning, intent and entity outputs. It needs the local FastAPI process but no cloud provider.

Model accuracy varies with language, accent, noise and code switching. Automatic speech-language detection is not the same as token-level language labeling. Verify a transcript against the recording before using it.

## Checks

```sh
npm --prefix frontend run test
npm --prefix frontend run lint
npm --prefix frontend run build
backend/.venv/bin/pytest -q backend/tests
npm --prefix mobile run typecheck
npm --prefix mobile run test
```

See [architecture](ARCHITECTURE.md), [demo steps](DEMO.md), [transcriber behavior](docs/transcriber.md), and [website setup](docs/website.md). The native prototype also contains transcription and model setup only; website development is the current focus.
