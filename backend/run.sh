#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")"

echo "=========================================================="
echo "      Starting Sai Music Academy FastAPI Backend           "
echo "=========================================================="

# Check if uv is installed
if command -v uv &> /dev/null; then
    echo "⚡ [1/2] Installing Python dependencies via uv..."
    uv pip install -r requirements.txt
    
    echo "🟢 [2/2] Starting FastAPI server on http://localhost:8000..."
    uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "🐍 [1/2] Installing Python dependencies via standard pip..."
    python3 -m pip install -r requirements.txt
    
    echo "🟢 [2/2] Starting FastAPI server on http://localhost:8000..."
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
fi
