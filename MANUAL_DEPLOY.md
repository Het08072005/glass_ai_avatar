# 🚀 ULTIMATE AWS DEPLOYMENT GUIDE (SOURCE OF TRUTH)

This guide provides the exact commands you need to run on your AWS instance to deploy the `glass_ai_avatar` project. Follow every step carefully.

---

## 🛠️ PREREQUISITES
- **Server IP:** `34.235.32.139`
- **Identity Key:** `ai_avatar.pem`
- **SSH Command:** `ssh -i ai_avatar.pem ubuntu@34.235.32.139`

---

## 📂 STEP 1: INITIALIZE SERVER (FIRST TIME ONLY)
If you haven't cloned the project on the server yet, do this:
```bash
ssh -i ai_avatar.pem ubuntu@34.235.32.139
git clone https://github.com/Het08072005/glass_ai_avatar.git ~/final_ecommerce_beyond
cd ~/final_ecommerce_beyond
```

---

## 🔐 STEP 2: BACKUP & CONFIGURE CADDY
On AWS, you already have a Caddyfile. We will back it up and then append our glass_ai_avatar configuration.

### 1. Backup existing Caddyfile
```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
```

### 2. Update Caddyfile with Glass AI Avatar domains
```bash
sudo nano /etc/caddy/Caddyfile
```
**Paste this at the end of the file:**
```caddy
# --- Glass AI Avatar Frontend ---
ui.34.235.32.139.nip.io {
    reverse_proxy 127.0.0.1:5173
}

# --- Glass AI Avatar Backend (API & WS) ---
api.34.235.32.139.nip.io {
    reverse_proxy 127.0.0.1:8000 {
        # Vital for WebSocket and dynamic content
        flush_interval -1
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```
*(Press `Ctrl+O`, `Enter` to save, then `Ctrl+X` to exit)*

### 3. Restart Caddy
```bash
sudo systemctl reload caddy
```

---

## 🔧 STEP 3: ENVIRONMENT SETUP (CRITICAL)
You must use `nano` to set up your production keys.

### 1. Configure Backend `.env`
```bash
cd ~/final_ecommerce_beyond/backend
nano .env
```
**Make sure these values are set:**
```env
# Database (Update with your actual AWS DB if different)
DATABASE_URL=postgresql://postgres:Het7890@localhost:5432/ecommerce

# Keys
GEMINI_API_KEY=your_gemini_key_here
LIVEKIT_URL=wss://your-livekit-url.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_secret_key
BEY_API_KEY=your_bey_key
BEY_AVATAR_ID=your_avatar_id
DEEPGRAM_API_KEY=your_deepgram_key

# Deployment Configs
ALLOW_ORIGINS=https://ui.34.235.32.139.nip.io,http://localhost:5173
INTERNAL_API_URL=http://127.0.0.1:8000
FRONTEND_URL=https://ui.34.235.32.139.nip.io
```

### 2. Configure Frontend `.env`
```bash
cd ~/final_ecommerce_beyond/frontend
nano .env
```
**Set these production URLs:**
```env
VITE_API_URL=https://api.34.235.32.139.nip.io/api
VITE_WS_URL=wss://api.34.235.32.139.nip.io/ws
VITE_LIVEKIT_URL=wss://your-livekit-url.cloud
```

---

## ⚡ STEP 4: SERVICE RESTART SEQUENCE (THE "BIG RED BUTTON")
Run these commands to start everything in the background.

### 1. Stop all current processes
```bash
pkill -f python3
pkill -f vite
```

### 2. Start Backend API
```bash
cd ~/final_ecommerce_beyond/backend
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*' > backend.log 2>&1 &
```

### 3. Start AI Agent (Wait for Backend)
```bash
sleep 2
cd ~/final_ecommerce_beyond/backend/app/agent
nohup python3 agents.py start > agent.log 2>&1 &
```

### 4. Start Frontend
```bash
cd ~/final_ecommerce_beyond/frontend
# Note: npm install might be needed if it's a fresh clone
# npm install
nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
```

---

## ✅ STEP 5: VERIFICATION
1. Browse to: `https://ui.34.235.32.139.nip.io`
2. Open Browser Console (`F12`). Look for `✅ WebSocket Connected Successfully`.
3. Try talking to the AI Avatar. If it stays silent, check `tail -f ~/final_ecommerce_beyond/backend/app/agent/agent.log`.

---

### 📝 MAINTENANCE TIPS
- **Check Logs:** `tail -f ~/final_ecommerce_beyond/backend/backend.log`
- **Caddy Errors:** `sudo journalctl -u caddy --no-pager | tail -n 50`
- **Port Conflict:** If a port is busy, use `fuser -k 8000/tcp` to clear it.
