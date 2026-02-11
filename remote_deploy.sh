#!/bin/bash

# Navigate to project root
cd /home/ubuntu/final_ecommerce_beyond

echo "--- Stopping existing services ---"
pkill -f python || true
pkill -f node || true
pkill -f caddy || true

echo "--- Services stopped. Starting deployment... ---"

# --- Backend ---
cd backend
echo "Installing Backend dependencies..."
pip install -r requirements.txt

# Ensure INTERNAL_API_URL is present for the Agent to work
if ! grep -q "INTERNAL_API_URL" .env; then
    echo "" >> .env
    echo "INTERNAL_API_URL=http://127.0.0.1:8000" >> .env
fi

echo "Starting Backend API..."
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# --- Agent ---
cd app/agent
echo "Starting AI Agent..."
nohup python agents.py start > agent.log 2>&1 &
cd ../../..

# --- Frontend ---
cd frontend
echo "Installing Frontend dependencies..."
npm install
echo "Starting Frontend..."
# Using 'dev' as requested by user ("deploy ... new terminal")
nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
cd ..

# --- Caddy ---
echo "Starting Caddy..."
nohup caddy run --config Caddyfile > caddy.log 2>&1 &

echo "🚀 DONE! Services are running in background."
