# ◈ LEXICLOUD — 3D Word Cloud

> Enter any article URL and watch its topics materialize as an interactive 3D word cloud.

![stack](https://img.shields.io/badge/React_Three_Fiber-TypeScript-00ffc8?style=flat-square)
![stack](https://img.shields.io/badge/FastAPI-Python-ff3cac?style=flat-square)

---

## Overview

**LEXICLOUD** is a full-stack application that:

1. Accepts a news article URL from the user
2. Crawls and cleans the article text (Python / httpx + BeautifulSoup)
3. Runs TF-IDF keyword extraction + LSA topic modeling (scikit-learn)
4. Returns structured word/weight/topic data as JSON
5. Renders a live, interactive **3D word cloud** using React Three Fiber (Three.js)

---

## Quick Start (macOS)

```bash
git clone https://github.com/<your-username>/3D-Word-Cloud-<YourName>.git
cd 3D-Word-Cloud-<YourName>
chmod +x setup.sh
./setup.sh
```

This single script:
- Creates a Python virtual environment and installs backend deps
- Runs `npm install` for the frontend
- Starts **both servers concurrently** (Ctrl+C stops both)

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| API docs | http://localhost:8000/docs |

---

## Project Structure

```
3D-Word-Cloud/
├── setup.sh              # ← run this to install & start everything
├── backend/
│   ├── main.py           # FastAPI app — crawl, TF-IDF, LSA
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx          # Root component + state machine
    │   ├── api.ts           # Fetch wrapper for /analyze
    │   ├── types.ts         # Shared TypeScript types
    │   └── components/
    │       ├── WordCloud.tsx      # React Three Fiber 3D scene
    │       ├── InputPanel.tsx     # URL input + sample links
    │       └── Legend.tsx         # Topic color key
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Libraries Used

### Backend
| Library | Purpose |
|---------|---------|
| **FastAPI** | REST API framework |
| **uvicorn** | ASGI server |
| **httpx** | Async HTTP client for fetching articles |
| **BeautifulSoup4** | HTML parsing & text extraction |
| **scikit-learn** | TF-IDF vectorization + LSA (TruncatedSVD) |
| **numpy** | Numeric operations |

### Frontend
| Library | Purpose |
|---------|---------|
| **React** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool / dev server |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | Three.js helpers (Text, OrbitControls) |
| **three.js** | 3D WebGL engine |

---

## API

### `POST /analyze`
```json
// Request
{ "url": "https://example.com/article" }

// Response
{
  "words": [
    { "word": "climate", "weight": 0.95, "topic": 0 },
    ...
  ],
  "topics": [
    ["climate", "carbon", "emissions"],
    ["policy", "government", "legislation"]
  ],
  "article_title": "Article headline…"
}
```

### `GET /health`
Returns `{ "status": "ok" }` — useful for readiness checks.

---

## How It Works

1. **Crawling** — `httpx` fetches the page with a browser-like User-Agent. BeautifulSoup strips scripts, nav, footer, and other boilerplate, preferring `<article>` / `<main>` containers.

2. **TF-IDF** — `TfidfVectorizer` splits the cleaned text into sentences and builds a term-frequency matrix (unigrams + bigrams, 200 features max).

3. **LSA Topic Modeling** — `TruncatedSVD` decomposes the TF-IDF matrix into latent topics. Each word is assigned to its dominant topic based on component loadings.

4. **3D Visualization** — Words are placed on a Fibonacci sphere for even distribution. Font size scales with TF-IDF weight; color encodes the LSA topic. The cloud auto-floats, supports drag-to-rotate, scroll-to-zoom, and word hover highlighting.

---

## Notes

- No API keys or external NLP services required — everything runs locally.
- The crawler handles most modern news sites but may be blocked by aggressive paywalls (NYT, WSJ). The included sample URLs are chosen to work reliably.
- Error states (network failure, insufficient text, HTTP errors) are surfaced in the UI.
