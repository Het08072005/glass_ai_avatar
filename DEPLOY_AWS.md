# 🚀 AWS End-to-End Deployment Guide

Your project code has been updated to fully support AWS deployment with:
1.  **Secure WebSockets** (`wss://`) for real-time features.
2.  **Caddy Reverse Proxy** for automatic HTTPS and domain routing.
3.  **Cross-Origin (CORS)** fixes for your specific domain.
4.  **Internal Loopback Fixes** for the AI Agent.

---

## 🏗️ 1. Setup Environment (Do this ONCE)

### Frontend
The file `frontend/.env.production` has been created for you with the correct AWS URLs.
**Action:** Copy it to `.env` (optional, but good for local dev on server)
```bash
cd frontend
cp .env.production .env
```

### Backend
You must create the `.env` file with your **REAL** keys.
**Action:**
```bash
cd backend
nano .env
```
Paste and fill these details:
```env
DATABASE_URL=postgresql://user:password@localhost/dbname
GEMINI_API_KEY=your_gemini_key
LIVEKIT_URL=wss://ecommerce-rhuqzlpi.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
BEY_API_KEY=your_bey_key
BEY_AVATAR_ID=your_avatar_id
FRONTEND_URL=https://ui.34.235.32.139.nip.io
ENV=production
# New fix for internal agent communication
INTERNAL_API_URL=http://127.0.0.1:8000
```

---

## ⚡ 2. Start Services (Run in separate terminals)

### Terminal 1: Caddy (The Gateway)
This handles HTTPS and routes traffic to frontend/backend.
```bash
# Make sure Caddyfile is in the root directory
caddy run --config Caddyfile
```

### Terminal 2: Backend API
```bash
cd backend
# Install dependencies
pip install -r requirements.txt
# Run the API
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 3: AI Agent
```bash
cd backend/app/agent
# Run the Agent
python agents.py start
```

### Terminal 4: Frontend (Development Mode)
Since you are using `npm run dev` on the server:
```bash
cd frontend
# Install dependencies
npm install
# Run the dev server
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## 🔍 3. Troubleshooting

### ❌ WebSocket Error / "Connecting..." Stuck
- **Check Caddy**: Ensure Caddy is running and port 80/443 are open in AWS Security Group.
- **Check Mixed Content**: If your site is HTTPS (it is via Caddy), the WebSocket MUST be `wss://`. The config I added handles this.

### ❌ Camera/Mic Not Working
- **HTTPS Required**: Browsers block camera on HTTP. Ensure you are accessing via `https://ui.34.235.32.139.nip.io`.
- **Permissions**: Check browser permissions settings.

### ❌ Agent Not Responding
- **Check Logs**: Look at Terminal 3 output.
- **Check Internal URL**: Verify `INTERNAL_API_URL` is set in backend `.env`.

### ❌ 3D Models / Images Missing
- **Route Proxy**: I added a rule to Caddy matching `/glasses/*` to serve files from the backend correctly.

---

## ✅ Verification
1. Open `https://ui.34.235.32.139.nip.io` in your browser.
2. The page should load securely (HTTPS).
3. Search should work immediately.
4. The AI Avatar should appear and connect within seconds.
