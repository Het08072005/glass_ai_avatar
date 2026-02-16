https://chatgpt.com/c/699019cc-57e8-83a9-a1ab-455583b1f0a4

```
cd OneDrive\Desktop\test1\glass_ai_avatar
```

```
ssh -i ai_avatar.pem ubuntu@34.235.32.139
```


🧹 STEP 1: KILL EVERYTHING PROPERLY

Sometimes old zombie processes sit there like stubborn ghosts 👻

Run this:
```
pkill -f uvicorn
pkill -f python3
pkill -f vite
pkill -f node

sleep 2
```

Now clear ports manually just to be sure:

```
sudo fuser -k 8000/tcp
sudo fuser -k 5173/tcp
```

🧪 STEP 2: CHECK IF PROJECT EXISTS
```
cd ~/final_ecommerce_beyond
ls
```

If folder missing → clone again:
```
git clone https://github.com/Het08072005/glass_ai_avatar.git ~/final_ecommerce_beyond
cd ~/final_ecommerce_beyond
```


🔧 STEP 3: BACKEND CLEAN START
```
cd ~/final_ecommerce_beyond/backend


Activate venv if you have one:

source venv/bin/activate


If no venv:

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt


Now start backend:

nohup python3 -m uvicorn app.main:app \
--host 0.0.0.0 \
--port 8000 \
--proxy-headers \
--forwarded-allow-ips='*' \
> backend.log 2>&1 &


Check if running:

lsof -i :8000

```
If you see python listening → backend alive 💚

🤖 STEP 4: START AI AGENT

```
cd ~/final_ecommerce_beyond/backend/app/agent
nohup python3 agents.py start > agent.log 2>&1 &


Check:

ps aux | grep agents.py

🎨 STEP 5: FRONTEND CLEAN START
cd ~/final_ecommerce_beyond/frontend


Install once if needed:

npm install


Now start:

nohup npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &


Check:

lsof -i :5173

```

🌐 STEP 6: RELOAD CADDY (IMPORTANT)
sudo systemctl reload caddy
sudo systemctl status caddy


If status shows active (running) → reverse proxy alive 🧠

🧪 STEP 7: TEST DIRECTLY (VERY IMPORTANT)

Before browser, test inside server:
    ```
curl http://127.0.0.1:8000

```
If backend responds → good.

Then:
```
curl http://127.0.0.1:5173


If HTML appears → frontend good.

🌍 NOW OPEN:
https://ui.34.235.32.139.nip.io



🚨 Agar fir bhi band ho jata hai

Check logs:

```
tail -f backend/backend.log
tail -f backend/app/agent/agent.log
tail -f frontend/frontend.log
```





# 2nd Method

🚀 FINAL PERMANENT DEPLOY (NO MORE ISSUES)

You are here:

/home/ubuntu/final_ecommerce_beyond/glass_ai_avatar


Good.

🧹 STEP 1: STOP EVERYTHING
pkill -f uvicorn
pkill -f agents.py
pkill -f vite
pkill -f node

🧠 STEP 2: BACKEND SERVICE CREATE
sudo nano /etc/systemd/system/glass-backend.service


Paste EXACTLY this:

[Unit]
Description=Glass AI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/final_ecommerce_beyond/glass_ai_avatar/backend
ExecStart=/home/ubuntu/final_ecommerce_beyond/glass_ai_avatar/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target


Save:
Ctrl + O → Enter → Ctrl + X

🤖 STEP 3: AGENT DEV SERVICE
sudo nano /etc/systemd/system/glass-agent.service


Paste:

[Unit]
Description=Glass AI Agent Dev
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/final_ecommerce_beyond/glass_ai_avatar/backend/app/agent
ExecStart=/home/ubuntu/final_ecommerce_beyond/glass_ai_avatar/backend/venv/bin/python agents.py dev
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target


Save and exit.

🎨 STEP 4: FRONTEND DEV SERVICE (IMPORTANT)
sudo nano /etc/systemd/system/glass-frontend.service


Paste:

[Unit]
Description=Glass AI Frontend Dev
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/final_ecommerce_beyond/glass_ai_avatar/frontend
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0 --port 5173
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target


Save.

🔥 STEP 5: ACTIVATE SERVICES
sudo systemctl daemon-reload

sudo systemctl enable glass-backend
sudo systemctl enable glass-agent
sudo systemctl enable glass-frontend

sudo systemctl start glass-backend
sudo systemctl start glass-agent
sudo systemctl start glass-frontend

🧪 STEP 6: CHECK STATUS
sudo systemctl status glass-backend
sudo systemctl status glass-agent
sudo systemctl status glass-frontend


All should show:

active (running)

🚦 STEP 7: CADDY CHECK
sudo systemctl status caddy


Should also be active.

🏆 NOW REAL TEST

Close SSH completely.

Reconnect:

ssh -i ai_avatar.pem ubuntu@34.235.32.139


Check:

sudo systemctl status glass-backend


Still running?
Then problem permanently solved.

💥 FINAL PROOF (ULTIMATE TEST)

Reboot server:

sudo reboot


After reconnect:

sudo systemctl status glass-backend


If running → deploy 100% permanent.



🧠 1️⃣ Backend Logs Check (Service Method)

Live logs dekhne ke liye:

sudo journalctl -u glass-backend -f


Last 100 lines:

sudo journalctl -u glass-backend -n 100

🤖 2️⃣ Agent Logs Check
sudo journalctl -u glass-agent -f


Last logs:

sudo journalctl -u glass-agent -n 100

🎨 3️⃣ Frontend Logs Check
sudo journalctl -u glass-frontend -f

🚦 4️⃣ Caddy Logs
sudo journalctl -u caddy -f

⚠️ Agar Service Down Ho Jaye

Check status + logs ek saath:

sudo systemctl status glass-backend


Ya:

sudo systemctl status glass-backend -n 50


Ye last 50 lines niche dikha dega.

🔥 Agar Restart Karna Ho
sudo systemctl restart glass-backend
sudo systemctl restart glass-agent
sudo systemctl restart glass-frontend

🎯 Sabse Important Debug Combo

Deploy ke baad hamesha ye 3 cheezein check karo:

sudo systemctl status glass-backend
sudo journalctl -u glass-backend -n 50
curl http://localhost:8000


Agar curl response de raha hai → backend alive ✅

Ab mujhe batao: