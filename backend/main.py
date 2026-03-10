from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import numpy as np
import math

app = FastAPI(title="3D Word Cloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STOP_WORDS = set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "up", "about", "into", "through", "during",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "this", "that", "these", "those", "it", "its", "he", "she", "they", "we",
    "i", "you", "him", "her", "them", "us", "my", "your", "his", "our",
    "as", "if", "then", "than", "so", "yet", "both", "each", "more", "also",
    "said", "says", "say", "can", "not", "no", "all", "when", "who", "which",
    "what", "how", "there", "their", "after", "before", "just", "over", "new",
    "get", "got", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "s", "re", "ve", "ll", "d", "t", "m"
])


class AnalyzeRequest(BaseModel):
    url: str


class WordData(BaseModel):
    word: str
    weight: float
    topic: int


class AnalyzeResponse(BaseModel):
    words: list[WordData]
    topics: list[list[str]]
    article_title: str


def fetch_article(url: str) -> tuple[str, str]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            resp = client.get(url, headers=headers)
            resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e}")

    soup = BeautifulSoup(resp.text, "html.parser")

    # Get title
    title = ""
    title_tag = soup.find("title")
    if title_tag:
        title = title_tag.get_text(strip=True)
    h1 = soup.find("h1")
    if h1:
        title = h1.get_text(strip=True)

    # Remove boilerplate
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "aside", "form", "button", "noscript", "iframe",
                     "meta", "link", "figure"]):
        tag.decompose()

    # Try content containers first
    text = ""
    for selector in ["article", "main", '[role="main"]', ".article-body",
                     ".post-content", ".entry-content", ".content"]:
        el = soup.select_one(selector)
        if el:
            text = el.get_text(separator=" ")
            break

    if not text:
        body = soup.find("body")
        text = body.get_text(separator=" ") if body else soup.get_text(separator=" ")

    # Clean text
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"[^\w\s\-']", " ", text)
    return title, text


def extract_words_tfidf(text: str, n_topics: int = 5) -> tuple[list[dict], list[list[str]]]:
    # Tokenize
    words = re.findall(r"\b[a-z]{3,}\b", text.lower())
    words = [w for w in words if w not in STOP_WORDS]

    if len(words) < 20:
        raise HTTPException(status_code=422, detail="Not enough text content found.")

    # Build sentences for TF-IDF
    sentences = re.split(r"[.!?]+", text.lower())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

    if len(sentences) < 3:
        # Fallback: simple frequency
        freq = Counter(words)
        total = sum(freq.values())
        results = [
            {"word": w, "weight": round(c / total * 10, 4), "topic": 0}
            for w, c in freq.most_common(60)
        ]
        return results, [list(freq.keys())[:10]]

    # TF-IDF vectorizer
    vectorizer = TfidfVectorizer(
        max_features=200,
        stop_words=list(STOP_WORDS),
        ngram_range=(1, 2),
        min_df=1,
        token_pattern=r"\b[a-z]{3,}\b"
    )
    try:
        tfidf_matrix = vectorizer.fit_transform(sentences)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Text processing failed: {e}")

    feature_names = vectorizer.get_feature_names_out()

    # LSA for topic discovery
    n_topics = min(n_topics, tfidf_matrix.shape[0] - 1, tfidf_matrix.shape[1] - 1)
    n_topics = max(2, n_topics)

    lsa = TruncatedSVD(n_components=n_topics, random_state=42)
    lsa.fit(tfidf_matrix)

    # Topic-word assignments
    topics = []
    for topic_idx, component in enumerate(lsa.components_):
        top_indices = component.argsort()[-10:][::-1]
        topic_words = [feature_names[i] for i in top_indices]
        topics.append(topic_words)

    # Score each term by max TF-IDF across documents
    tfidf_dense = tfidf_matrix.toarray()
    term_scores = tfidf_dense.max(axis=0)

    # Assign each term to its dominant topic
    word_results = []
    for i, (term, score) in enumerate(zip(feature_names, term_scores)):
        if score < 0.01:
            continue
        # Which topic component loads this term most?
        topic_loadings = [abs(lsa.components_[t][i]) for t in range(n_topics)]
        dominant_topic = int(np.argmax(topic_loadings))
        word_results.append({
            "word": term,
            "weight": round(float(score), 4),
            "topic": dominant_topic
        })

    # Normalize weights to [0.3, 1.0]
    if word_results:
        max_w = max(r["weight"] for r in word_results)
        min_w = min(r["weight"] for r in word_results)
        rng = max_w - min_w if max_w != min_w else 1
        for r in word_results:
            r["weight"] = round(0.3 + 0.7 * (r["weight"] - min_w) / rng, 4)

    word_results.sort(key=lambda x: x["weight"], reverse=True)
    return word_results[:80], topics


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    title, text = fetch_article(req.url)
    words, topics = extract_words_tfidf(text)
    return AnalyzeResponse(words=words, topics=topics, article_title=title)


@app.get("/health")
async def health():
    return {"status": "ok"}
