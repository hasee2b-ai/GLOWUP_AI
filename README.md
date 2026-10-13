# GlowUp AI

**Your imagination, beautifully generated.**

GlowUp AI is a premium AI image-generation platform. Enter a text prompt and
generate stunning visuals through the SenseNova image-generation API. It pairs a
polished marketing landing page with a dedicated, responsive generation studio.

> This is a database-free MVP: no SQL, no user accounts, no authentication, and
> no billing. Generated images are not stored permanently on the server.

---

## Features

- **Premium landing page** — hero, feature highlights, "how it works", and a
  final call to action, all responsive from mobile to desktop.
- **AI generation studio** (`/create`) — prompt editor, aspect-ratio / image-count
  controls, prompt-enhancement and watermark toggles.
- **Real provider integration** — talks to the SenseNova image-generation
  endpoint through a FastAPI backend. No fake or simulated results.
- **Image preview & download** — base64 and URL responses are normalized and can
  be downloaded with the correct file extension.
- **Loading, empty, and error states** — skeletons, inline errors, and toast
  feedback.
- **Session history** — recent generations kept in React state and a capped
  localStorage list (never stores API keys).
- **Security-first** — the API key lives only in the backend environment; CORS
  is narrowly configured; prompts and parameters are validated server-side.

---

## Technology stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Frontend  | React (JSX), Vite, Tailwind CSS, React Router, Lucide icons |
| Backend   | Python 3.11+, FastAPI, Uvicorn, Pydantic, HTTPX, python-dotenv |
| Provider  | SenseNova image-generation API                              |

---

## Prerequisites

- **Python 3.11+** (developed and verified on Python 3.14)
- **Node.js 18+** and npm
- A **SenseNova API key** with access to an image-generation model

---

## Project structure

```
glowup-ai/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/      # Navbar, Footer, PromptEditor, SettingsPanel, ...
│   │   ├── pages/           # Landing, Create
│   │   ├── hooks/           # useLocalStorage
│   │   ├── services/        # api.js (backend client)
│   │   ├── utils/           # helpers, constants
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS + request-size limit
│   │   ├── config.py        # env-driven configuration
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── routes/          # /api/health, /api/generate
│   │   └── services/        # sensenova.py (provider integration)
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **macOS / Linux:** `source .venv/bin/activate`

Install dependencies:

```bash
pip install -r requirements.txt
```

### Configure the API key

Copy the example environment file and fill in your **own** key:

```bash
cp .env.example .env
```

Edit `.env`:

```
SENSENOVA_API_KEY=your_real_key_here
SENSENOVA_BASE_URL=https://token.sensenova.ai/v1
SENSENOVA_IMAGE_MODEL=sensenova-u1.5-lite
SENSENOVA_IMAGE_ENDPOINT=/images/generations
FRONTEND_ORIGIN=http://localhost:5173
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
```

> **Important:** the real API key must be configured in the backend environment
> before image generation will work. Never commit `.env` — it is git-ignored.

### Run the backend

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The health check is available at `http://127.0.0.1:8000/api/health`.

---

## Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
```

Optionally configure the backend URL (defaults to `http://127.0.0.1:8000`):

```bash
cp .env.example .env
```

Run the dev server:

```bash
npm run dev
```

The app is available at `http://localhost:5173` (Vite's default port).

---

## API endpoints

### `GET /api/health`

Returns a minimal, non-sensitive status:

```json
{ "status": "ok", "provider_configured": true }
```

### `POST /api/generate`

Request body:

```json
{
  "prompt": "A cinematic futuristic city at sunset",
  "size": "1024x1024",
  "n": 1,
  "prompt_extend": true,
  "watermark": true
}
```

Success response:

```json
{
  "success": true,
  "images": [
    { "url": "https://...", "mime_type": "image/png", "width": 1024, "height": 1024 }
  ],
  "prompt": "A cinematic futuristic city at sunset"
}
```

For base64 responses the backend returns a browser-usable `data:` URL. Errors
return an appropriate HTTP status code and a safe, user-readable `detail`.

---

## Supported sizes & parameters

| Parameter        | Supported values                          |
| ---------------- | ----------------------------------------- |
| `size`           | `1024x1024`, `1024x1536`, `1536x1024`     |
| `n`              | `1`, `2`, `4`                              |
| `prompt_extend`  | `true` / `false`                           |
| `watermark`      | `true` / `false`                           |

Only sizes and options documented as supported by the provider are exposed. If a
value is unsupported, the backend returns a clear validation error.

---

## Security considerations

- The SenseNova API key is stored **only** in the backend `.env` and is never
  sent to the browser, logged, or included in responses.
- CORS is restricted to `FRONTEND_ORIGIN` (default `http://localhost:5173`).
- Prompts are trimmed, length-limited, and validated; sizes and counts are
  allow-listed.
- A lightweight in-memory rate limiter guards the generation endpoint. **This is
  not a distributed, production-grade rate limiter** and resets on restart.
- Request bodies are capped at 1 MB.
- No authentication or billing is implemented in this version; the endpoints are
  not protected against all abuse.

---

## Troubleshooting

- **"Cannot reach the backend"** — make sure uvicorn is running on port 8000 and
  that `VITE_API_BASE_URL` matches.
- **"missing the SenseNova API key"** — set `SENSENOVA_API_KEY` in `backend/.env`
  and restart the server.
- **401 from the provider** — the API key is invalid or expired.
- **403 from the provider** — the account lacks permission for the configured model.
- **404 from the provider** — the endpoint or model is unavailable for the account.
- **429** — rate limited; wait a moment and try again.
- **Image fails to load in the UI** — the remote URL may have expired; regenerate
  or re-download from history.

---

## Known limitations

- No persistent storage of generated images on the server; session history is
  kept in the browser (localStorage) and is not synced across devices.
- The in-memory rate limiter is per-process and not suitable for multi-instance
  deployments.
- The real SenseNova integration is only verified when a valid, locally configured
  API key is present and a real request succeeds.
