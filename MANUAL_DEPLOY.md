# 🚀 COMPLETE AWS DEPLOYMENT GUIDE (Step-by-Step)

This guide allows you to deploy your **local project** (`test13`) directly to your **AWS Server** using the terminal.

### ✅ Prerequisites
- **Local Project**: You are in the root folder `test13`.
- **AWS Key**: You have `ai_avatar.pem` in this folder.
- **Server IP**: `34.235.32.139` (or `34.229.64.156` if that was the one, but I used `34.235.32.139` based on your Caddyfile).
- **Remote User**: `ubuntu`
- **Remote Folder**: `/home/ubuntu/final_ecommerce_beyond`

---

## 🛠️ STEP 1: Upload Your Fixed Project Code
Run these commands **one by one** in your local terminal (PowerShell or Git Bash) to push your latest fixes to the server.

```powershell
# 1. Upload Backend Agent Fixes (Critical for AI Voice)
scp -i ai_avatar.pem -o StrictHostKeyChecking=no backend/app/agent/agents.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/agent/
scp -i ai_avatar.pem -o StrictHostKeyChecking=no backend/app/agent/tools.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/agent/

# 2. Upload Backend Main App (Critical for CORS)
scp -i ai_avatar.pem -o StrictHostKeyChecking=no backend/app/main.py ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/backend/app/

# 3. Upload Frontend Config (Critical for connection)
scp -i ai_avatar.pem -o StrictHostKeyChecking=no frontend/vite.config.js ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/frontend/
scp -i ai_avatar.pem -o StrictHostKeyChecking=no frontend/.env.production ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/frontend/

# 4. Upload Caddyfile (Critical for HTTPS Domain)
scp -i ai_avatar.pem -o StrictHostKeyChecking=no Caddyfile ubuntu@34.235.32.139:/home/ubuntu/final_ecommerce_beyond/
```

---

## 🔧 STEP 2: Configure Server (Run via SSH)

Connect to your server:
```powershell
ssh -i ai_avatar.pem ubuntu@34.235.32.139
```

Once inside the server, run these commands:

### 1. Go to Project Directory
```bash
cd final_ecommerce_beyond
```

### 2. Setup Environment Variables
```bash
# Frontend
cp frontend/.env.production frontend/.env

# Backend (Append the internal URL fix without deleting your keys)
echo "INTERNAL_API_URL=http://127.0.0.1:8000" >> backend/.env
```

### 3. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
npm install
cd ..
```

---

## ⚡ STEP 3: Restart Services (End-to-End)

You need to stop running services and start new ones.

### 1. Stop Existing Services
(Try to kill old processes to free up ports)
```bash
pkill -f python
pkill -f node
pkill -f caddy
```

### 2. Start Caddy (HTTPS Gateway)
```bash
# Run in background
nohup caddy run --config Caddyfile > caddy.log 2>&1 &
```

### 3. Start Backend API
```bash
cd backend
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
cd ..
```

### 4. Start AI Agent
```bash
cd backend/app/agent
nohup python agents.py start > agent.log 2>&1 &
cd ../../..
```

### 5. Start Frontend
```bash
cd frontend
nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
cd ..
```

---

## ✅ STEP 4: Verify Deployment

1.  **Open in Browser**: `https://ui.34.235.32.139.nip.io`
2.  **Check Console**: If there are errors, check the logs on server:
    ```bash
    tail -f backend.log
    tail -f agent.log
    ```

---

### 🚨 Common Fixes Included in This Deployment:
1.  **Socket Error**: Fixed by Caddyfile proxying `/api` correctly.
2.  **Agent Not Speaking**: Fixed by restoring `agents.py` with `inference` module (as requested) + connection repairs.
3.  **Media Permission Error**: Fixed by serving over **HTTPS** via Caddy (Browser blocks mic on HTTP).
4.  **CORS Error**: Fixed by updating `allowed_origins` in `main.py`.
