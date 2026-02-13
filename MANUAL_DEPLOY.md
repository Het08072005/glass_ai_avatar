# 🚀 END-TO-END AWS DEPLOYMENT GUIDE (MASTER VERSION)

This guide provides the exact steps to deploy your **ShadowHub / AI Avatar** project. Follow these steps sequentially on your AWS instance.

---

## 🛠️ PREREQUISITES
1. **Server IP:** `34.235.32.139`
2. **Key File:** `ai_avatar.pem` (Must be in your local project root)
3. **OS:** Ubuntu (AWS EC2)

---

## 📂 STEP 1: INITIAL SERVER PREP (SSH)
Connect to your server:
```bash
# From your local terminal (ensure you are in glass_ai_avatar folder)
ssh -i ai_avatar.pem ubuntu@34.235.32.139
```

Once inside the server, navigate to your project folder:
```bash
cd ~/final_ecommerce_beyond
```

---

## 🔐 STEP 2: CONFIGURE ENVIRONMENT VARIABLES (nano)
You MUST update the `.env` files for both Backend and Frontend to work with production domains.

### 1. Update Backend `.env`
```bash
cd ~/final_ecommerce_beyond/backend
nano .env
```
**Ensure these specific lines are updated/added:**
```env
# Change this to allow your production frontend domain
ALLOW_ORIGINS=https://ui.34.235.32.139.nip.io,http://localhost:5173

# Internal URL for Agent communication
INTERNAL_API_URL=http://127.0.0.1:8000
```
*(Press `Ctrl+O`, `Enter` to save, then `Ctrl+X` to exit)*

### 2. Update Frontend `.env`
```bash
cd ~/final_ecommerce_beyond/frontend
nano .env
```
**Update to use production URLs:**
```env
VITE_API_URL=https://api.34.235.32.139.nip.io/api
VITE_WS_URL=wss://api.34.235.32.139.nip.io/ws
VITE_LIVEKIT_URL=wss://ecommerce-xaanlrl1.livekit.cloud
```
*(Press `Ctrl+O`, `Enter` to save, then `Ctrl+X` to exit)*

---

## 🌐 STEP 3: CADDY CONFIGURATION (DO NOT OVERWRITE)
Since you have an existing Caddy, **COPY** these blocks and add them to your global Caddyfile (usually at `/etc/caddy/Caddyfile`).

```caddy
# --- SHADOWHUB FRONTEND ---
ui.34.235.32.139.nip.io {
    reverse_proxy 127.0.0.1:5173
}

# --- SHADOWHUB BACKEND (API & WS) ---
api.34.235.32.139.nip.io {
    reverse_proxy 127.0.0.1:8000 {
        # WebSocket Support
        flush_interval -1
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

**Restart Caddy after editing:**
```bash
sudo systemctl restart caddy
```

---

## ⚡ STEP 4: SYSTEM STARTUP SEQUENCE
Run these commands to start all services in the background.

### 1. Start Backend API
```bash
cd ~/final_ecommerce_beyond/backend
# Kill old process if exists
pkill -f "uvicorn app.main:app"
# Start new
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*' > backend.log 2>&1 &
```

### 2. Start AI Agent
```bash
cd ~/final_ecommerce_beyond/backend/app/agent
# Kill old process
pkill -f "agents.py"
# Wait for backend to be ready
sleep 3
# Start new
nohup python3 agents.py start > agent.log 2>&1 &
```

### 3. Start Frontend
```bash
cd ~/final_ecommerce_beyond/frontend
# Kill old process
pkill -f "vite"
# Start new (using dev server for nip.io testing)
nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
```

---

## ✅ STEP 5: VERIFICATION
1. Navigate to: `https://ui.34.235.32.139.nip.io`
2. Open Browser Console (`F12`).
3. You should see: `✅ WebSocket Connected Successfully`.
4. Test the AI Avatar - it should respond and sync product views.

---

### 📝 NOTES
- **Logs:** If something fails, check `tail -f backend.log` or `tail -f agent.log`.
- **CORS:** If you see CORS errors, double-check `ALLOW_ORIGINS` in `backend/.env`.
