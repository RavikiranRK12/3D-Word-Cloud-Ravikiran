#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------
# 3D Word Cloud – one-shot setup + start (macOS)
# -------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"

echo ""
echo "  ◈  LEXICLOUD – 3D Word Cloud"
echo "  ──────────────────────────────"

# ── Prerequisites check ───────────────────────────────
command -v python3 >/dev/null 2>&1 || { echo "✗ python3 not found. Install via brew or python.org"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "✗ node not found. Install via brew or nodejs.org"; exit 1; }
command -v npm     >/dev/null 2>&1 || { echo "✗ npm not found. Install Node.js"; exit 1; }

echo "  ✓ python3  $(python3 --version)"
echo "  ✓ node     $(node --version)"
echo "  ✓ npm      $(npm --version)"
echo ""

# ── Backend: Python virtual env + deps ────────────────
echo "  [1/3] Setting up Python environment…"
if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi
# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r "$BACKEND_DIR/requirements.txt"
echo "  ✓ Backend dependencies installed"

# ── Frontend: npm install ─────────────────────────────
echo "  [2/3] Installing frontend dependencies…"
cd "$FRONTEND_DIR"
npm install --silent
echo "  ✓ Frontend dependencies installed"

# ── Start both servers ────────────────────────────────
echo "  [3/3] Starting servers…"
echo ""
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# Trap Ctrl+C to kill both child processes
cleanup() {
  echo ""
  echo "  Shutting down…"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# Start backend
cd "$BACKEND_DIR"
source "$VENV_DIR/bin/activate"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

# Wait for either process to exit
wait "$BACKEND_PID" "$FRONTEND_PID"
