#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")"

echo "=========================================================="
echo "      Starting Sai Music Academy FastAPI Backend           "
echo "=========================================================="

# Check if uv is installed
if command -v uv &> /dev/null; then
    echo "⚡ [1/2] Setting up virtual environment and dependencies via uv..."
    if [ ! -d ".venv" ]; then
        uv venv
    fi
    source .venv/bin/activate
    uv pip install -r requirements.txt
    
    echo "🟢 [2/2] Starting FastAPI server on http://localhost:8000..."
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "🐍 [1/2] Setting up virtual environment and dependencies via python3..."
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements.txt
    
    echo "🟢 [2/2] Starting FastAPI server on http://localhost:8000..."
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
fi
