# 🚀 COMPLETE AWS DEPLOYMENT GUIDE (SOURCE OF TRUTH)

This guide provides the absolute end-to-end steps to deploy your `test13` project to AWS with **Full AI Voice**, **Secure WebSockets**, and **Fast Product Synchronization**.

### ✅ Prerequisites
- Local folder: `test13`
- AWS Key: `ai_avatar.pem` (in root)
- Server IP: `34.235.32.139`
- Domains: `ui.34.235.32.139.nip.io` (Frontend), `api.34.235.32.139.nip.io` (Backend)

---

## 🛠️ STEP 1: Upload Updated Files (Run Locally)
Run these commands in your local PowerShell to push the latest end-to-end fixes (WebSocket keep-alive, CORS, AI Sync) to your server.

```powershell
# 1. CORE CONFIGS
scp -i ai_avatar.pem Caddyfile ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/
scp -i ai_avatar.pem backend/app/main.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/

# 2. WEBSOCKET & PRODUCT SYNC FIXES
scp -i ai_avatar.pem frontend/src/websocket.js ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/frontend/src/
scp -i ai_avatar.pem backend/app/websocket/routes.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/websocket/
scp -i ai_avatar.pem frontend/src/pages/Products.jsx ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/frontend/src/pages/
scp -i ai_avatar.pem frontend/src/components/ai_avatar/LiveKitWidgetSticky.jsx ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/frontend/src/components/ai_avatar/

# 3. AI AGENT & PROMPT REPAIRS
scp -i ai_avatar.pem backend/app/agent/agents.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/agent/
scp -i ai_avatar.pem backend/app/agent/tools.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/agent/
scp -i ai_avatar.pem backend/app/agent/prompts.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/agent/
```

---

## 🔧 STEP 2: Server Setup (Run via SSH)
Connect: `ssh -i ai_avatar.pem ubuntu@34.235.32.139`

### 1. Update Environment Variables
Ensure `.env` files are correct:
```bash
cd ~/final_ecommerce_beyond

# Frontend: Use production URLS
cp frontend/.env.production frontend/.env

# Backend: Fix internal communication for the agent
# Make sure your backend/.env has the REAL Gemini/LiveKit keys!
echo "INTERNAL_API_URL=http://127.0.0.1:8000" >> backend/.env
echo "FRONTEND_URL=https://ui.34.235.32.139.nip.io" >> backend/.env
```

### 2. Install/Refresh Deps (If needed)
```bash
cd backend && pip install -r requirements.txt && cd ..
cd frontend && npm install && cd ..
```

---

## ⚡ STEP 3: RESTART SYSTEM (THE RELOAD SEQUENCE)
You MUST restart everything in this exact order to clear old sockets.

### 1. Kill everything
```bash
pkill -f python
pkill -f node
pkill -f caddy
```

### 2. Start Caddy (HTTPS & Domain Gateway)
```bash
# Verify Caddyfile exists in root
nohup caddy run --config Caddyfile > caddy.log 2>&1 &
```

### 3. Start Backend API
```bash
cd backend
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### 4. Start AI Agent (Wait 5s after Backend starts)
```bash
sleep 5
cd ~/final_ecommerce_beyond/backend/app/agent
nohup python agents.py start > agent.log 2>&1 &
```

### 5. Start Frontend
```bash
cd ~/final_ecommerce_beyond/frontend
nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
```

---

## ✅ STEP 4: VERIFICATION
1. Open Your Browser to: `https://ui.34.235.32.139.nip.io`
2. Open Console (F12) -> should see `✅ WebSocket Connected Successfully`.
3. If you see `1006` or `CORS Error`, check `tail -f ~/final_ecommerce_beyond/backend.log`.

---

### 🛡️ What we fixed in this run:
- **WebSocket 1006 Error**: Added `ping/pong` keep-alives every 25s.
- **CORS Blocked**: Updated `main.py` with the correct `nip.io` origins.
- **AI Silence**: Forced `agents.py` to greet using `SESSION_INSTRUCTION` on start.
- **Protocol Mismatch**: Automatically upgrades `ws://` to `wss://` in production.
- **Product Overwrite**: Products page now locks state when AI search arrives.
