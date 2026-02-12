# Deployment Guide: E-commerce with AI Agents (AWS + Nginx + SSL)

This guide provides a step-by-step procedure to deploy the Frontend, Backend, and AI Agents on an AWS EC2 instance using Nginx and SSL.

## 1. Architecture Overview
- **Frontend**: React (Vite) - Served as static files by Nginx.
- **Backend**: FastAPI - Running via Uvicorn/Gunicorn.
- **AI Agent**: LiveKit Agent - Running as a separate Python process.
- **Database**: Neon (Managed PostgreSQL).
- **Reverse Proxy**: Nginx (Handles HTTPS, SSL Termination, and routing).
- **SSL**: Let's Encrypt (Certbot).

---

## 2. AWS Setup (EC2)

1. **Launch Instance**:
   - OS: Ubuntu 22.04 LTS.
   - Instance Type: `t3.medium` or higher (recommended for running AI agents and backend).
2. **Security Groups**:
   - Allow **Port 80** (HTTP).
   - Allow **Port 443** (HTTPS).
   - Allow **Port 22** (SSH).
   - Allow **Port 8000** (Optional, only for testing. Nginx will internalize this).
3. **Elastic IP**: Assign an Elastic IP to your instance so it doesn't change on reboot.

---

## 3. Server Preparation

Connect to your EC2:
```bash
ssh -i "your-key.pem" ubuntu@your-ip
```

Update and install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git curl
```

---

## 4. Backend Deployment

1. **Clone Repo**:
   ```bash
   git clone <your-repo-url> /var/www/ecommerce
   cd /var/www/ecommerce/backend
   ```
2. **Setup Virtual Env**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install uvicorn gunicorn
   ```
3. **Environment Variables**:
   Create `.env` file in `backend/` and copy contents from your local `.env`. Ensure `ALLOW_ORIGINS` includes your production domain.
   ```bash
   nano .env
   # Update ALLOW_ORIGINS=https://yourdomain.com
   ```
4. **Create Systemd Service for Backend**:
   ```bash
   sudo nano /etc/systemd/system/ecommerce-backend.service
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=Gunicorn instance to serve Ecommerce Backend
   After=network.target

   [Service]
   User=ubuntu
   Group=www-data
   WorkingDirectory=/var/www/ecommerce/backend
   Environment="PATH=/var/www/ecommerce/backend/venv/bin"
   ExecStart=/var/www/ecommerce/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 127.0.0.1:8000

   [Install]
   WantedBy=multi-user.target
   ```
   Start Backend:
   ```bash
   sudo systemctl start ecommerce-backend
   sudo systemctl enable ecommerce-backend
   ```

---

## 5. AI Agent Deployment (`agents.py`)

The agent needs to run continuously to listen for LiveKit jobs.

1. **Create Systemd Service for Agent**:
   ```bash
   sudo nano /etc/systemd/system/ecommerce-agent.service
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=LiveKit AI Agent
   After=network.target ecommerce-backend.service

   [Service]
   User=ubuntu
   Group=www-data
   WorkingDirectory=/var/www/ecommerce/backend/app/agent
   Environment="PATH=/var/www/ecommerce/backend/venv/bin"
   # PYTHONPATH must include the root of the app
   Environment="PYTHONPATH=/var/www/ecommerce/backend"
   ExecStart=/var/www/ecommerce/backend/venv/bin/python agents.py dev
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   *Note: In production, `dev` flag in `agents.py` might be changed to `start` depending on how you want to manage job dispatching.*

   Start Agent:
   ```bash
   sudo systemctl start ecommerce-agent
   sudo systemctl enable ecommerce-agent
   ```

---

## 6. Frontend Deployment

1. **Build Locally or on Server**:
   If building on server (ensure Node.js is installed):
   ```bash
   cd /var/www/ecommerce/frontend
   # Install Node.js if not present
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   npm install
   # Create .env for frontend
   nano .env
   # VITE_API_URL=https://yourdomain.com/api
   # VITE_WS_URL=wss://yourdomain.com/ws
   # VITE_LIVEKIT_URL=wss://your-livekit-url
   
   npm run build
   ```
   The build files will be in `/var/www/ecommerce/frontend/dist`.

---

## 7. Nginx Configuration (The Core)

1. **Config File**:
   ```bash
   sudo nano /etc/nginx/sites-available/ecommerce
   ```
   Paste the following (Replace `yourdomain.com`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend Static Files
       location / {
           root /var/www/ecommerce/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API Proxy
       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # WebSocket Proxy
       location /ws {
           proxy_pass http://127.0.0.1:8000/ws;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
2. **Enable Config**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 8. SSL Setup (HTTPS)

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. **Generate Certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
   Certbot will automatically update your Nginx config to handle HTTPS and redirect HTTP to HTTPS.

---

## 9. Potential Issues & Fixes

1. **CORS Errors**: 
   Ensure `ALLOW_ORIGINS` in `backend/.env` is exactly `https://yourdomain.com` (no trailing slash).
2. **WebSocket (WSS) Failures**: 
   When using HTTPS, you **must** use `wss://` instead of `ws://`. Nginx handles the upgrade from `ws` to `wss` internally as long as the headers are set correctly.
3. **LiveKit Agent Connectivity**:
   If the agent is not responding, check the logs:
   ```bash
   sudo journalctl -u ecommerce-agent -f
   ```
   Ensure the `LIVEKIT_URL` in `.env` is correct.
4. **SSL Cerifi Code**:
   The code `os.environ["SSL_CERT_FILE"] = certifi.where()` in your Python files is good. It ensures that your Python app can safely make requests to external SSL services (Gemini, LiveKit) within the Linux environment.

## 10. Summary of Commands
- **Restart Backend**: `sudo systemctl restart ecommerce-backend`
- **Restart Agent**: `sudo systemctl restart ecommerce-agent`
- **Restart Nginx**: `sudo systemctl restart nginx`
- **View Logs**: `tail -f /var/log/nginx/error.log`
