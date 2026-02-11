import os
import shutil
import subprocess
import time
from pathlib import Path

# Config
SERVER_IP = "34.235.32.139"
KEY_FILE = "ai_avatar.pem"
USER = "ubuntu"
REMOTE_DIR = "/home/ubuntu/final_ecommerce_beyond"
TEMP_DIR = ".deploy_staging"
ZIP_FILE = "project_deploy" # shutil adds .zip automatically

def run_cmd(cmd):
    print(f"--- Executing: {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"[ERROR] Command failed: {cmd}")
        # Dont exit, try to continue cleanup? No, fail fast.
        exit(1)

def main():
    print(f"[DEPLOY] Starting Deployment to {SERVER_IP}...")

    # 1. Clean Staging
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    print("[DEPLOY] Staging files...")
    # Copy critical folders
    for item in ["backend", "frontend", "Caddyfile", "remote_deploy.sh"]:
        src = Path(item)
        dst = Path(TEMP_DIR) / item
        if src.exists():
            if src.is_dir():
                shutil.copytree(src, dst)
            elif src.is_file():
                shutil.copy2(src, dst)
        else:
            print(f"[WARN] {item} not found!")
            
    if os.path.exists(KEY_FILE):
        shutil.copy2(KEY_FILE, os.path.join(TEMP_DIR, KEY_FILE))

    # Cleanup Junk
    print("[DEPLOY] Cleaning up junk files...")
    for root, dirs, files in os.walk(TEMP_DIR):
        for d in dirs[:]:
            if d in ["__pycache__", ".venv", "node_modules", ".git", "dist"]:
                shutil.rmtree(os.path.join(root, d))
                dirs.remove(d)

    # 2. Zip
    if os.path.exists(ZIP_FILE + ".zip"):
        os.remove(ZIP_FILE + ".zip")
    print("[DEPLOY] Zipping project...")
    shutil.make_archive(ZIP_FILE, 'zip', TEMP_DIR)
    
    # 3. Upload
    print("[DEPLOY] Uploading Zip and Scripts...")
    # Upload Zip
    run_cmd(f'scp -i {KEY_FILE} -o StrictHostKeyChecking=no {ZIP_FILE}.zip {USER}@{SERVER_IP}:/home/{USER}/')
    # Upload Bootstrap
    run_cmd(f'scp -i {KEY_FILE} -o StrictHostKeyChecking=no bootstrap.sh {USER}@{SERVER_IP}:/home/{USER}/')
    
    # Upload Secrets
    print("[DEPLOY] Uploading Secrets...")
    run_cmd(f'scp -i {KEY_FILE} -o StrictHostKeyChecking=no backend/.env {USER}@{SERVER_IP}:{REMOTE_DIR}/backend/.env')
    run_cmd(f'scp -i {KEY_FILE} -o StrictHostKeyChecking=no frontend/.env {USER}@{SERVER_IP}:{REMOTE_DIR}/frontend/.env')

    # 4. Remote Execution
    print("[DEPLOY] Triggering Remote Deployment...")
    # Use list for subprocess run if shell=False was used, but shell=True needs string.
    # Quote the remote command carefully.
    ssh_cmd = f'ssh -i {KEY_FILE} -o StrictHostKeyChecking=no {USER}@{SERVER_IP} "chmod +x bootstrap.sh && ./bootstrap.sh"'
    run_cmd(ssh_cmd)

    # Cleanup
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    if os.path.exists(ZIP_FILE + ".zip"):
        os.remove(ZIP_FILE + ".zip")

    print(f"[SUCCESS] DEPLOYMENT COMPLETE! Site: https://ui.{SERVER_IP}.nip.io")

if __name__ == "__main__":
    main()
