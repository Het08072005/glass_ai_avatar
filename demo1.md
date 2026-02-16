1️⃣ Stop sab kuch
pkill -f uvicorn
pkill -f agents.py
pkill -f vite
pkill -f node


━━━━━━━━━━━━━━━━━━

2️⃣ BACKEND SERVICE
sudo nano /etc/systemd/system/glass-backend.service


Paste:

[Unit]
Description=Glass AI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/final_ecommerce_beyond/backend
ExecStart=/home/ubuntu/final_ecommerce_beyond/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target


Save and exit.

━━━━━━━━━━━━━━━━━━

3️⃣ AGENT SERVICE
sudo nano /etc/systemd/system/glass-agent.service


Paste:

[Unit]
Description=Glass AI Agent
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/final_ecommerce_beyond/backend/app/agent
ExecStart=/home/ubuntu/final_ecommerce_beyond/backend/venv/bin/python agents.py start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target


Save.

━━━━━━━━━━━━━━━━━━

4️⃣ FRONTEND (IMPORTANT)

⚠️ Dev server mat use karo production me.

Better:

cd ~/final_ecommerce_beyond/frontend
npm run build


Then Caddy se frontend/dist serve karna best hai.

Agar phir bhi dev mode hi chahiye:

sudo nano /etc/systemd/system/glass-frontend.service


Paste:

[Unit]
Description=Glass AI Frontend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/final_ecommerce_beyond/frontend
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0 --port 5173
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target


━━━━━━━━━━━━━━━━━━

5️⃣ Activate Everything
sudo systemctl daemon-reload
sudo systemctl enable glass-backend
sudo systemctl enable glass-agent
sudo systemctl enable glass-frontend

sudo systemctl start glass-backend
sudo systemctl start glass-agent
sudo systemctl start glass-frontend


Check:

sudo systemctl status glass-backend


Should show:

active (running)

━━━━━━━━━━━━━━━━━━
💥 TEST AUTO-RESTART

Kill backend manually:

sudo kill -9 $(pgrep -f uvicorn)


Wait 3 seconds.

Check:

sudo systemctl status glass-backend


If running again → auto restart working 🎯

━━━━━━━━━━━━━━━━━━
🏆 ULTIMATE TEST

Reboot server:

sudo reboot


Reconnect.

Check:

sudo systemctl status glass-backend


If running → permanent solution done.

━━━━━━━━━━━━━━━━━━
⚠️ VERY IMPORTANT

If server RAM kam hai (1GB), aur crash memory se ho raha hai,
to systemd restart karega, but phir se crash hoga.

Toh swap add karna zaroori ho sakta hai.

Check memory:

free -h


━━━━━━━━━━━━━━━━━━

Agar chaho to main tu