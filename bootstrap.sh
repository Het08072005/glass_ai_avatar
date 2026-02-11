#!/bin/bash
# BOOTSTRAP: Install Unzip, Extract Project, Fix Permissions, Run Deploy Script.
# This runs on the remote server.

echo "--- [BOOTSTRAP] Installing system dependencies... ---"
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y unzip

echo "--- [BOOTSTRAP] Extracting project... ---"
PROJECT_DIR="/home/ubuntu/final_ecommerce_beyond"
mkdir -p "$PROJECT_DIR"

if [ -f "project_deploy.zip" ]; then
    unzip -o project_deploy.zip -d "$PROJECT_DIR"
else
    echo "❌ ERROR: project_deploy.zip not found!"
    exit 1
fi

echo "--- [BOOTSTRAP] Fixing permissions... ---"
chmod +x "$PROJECT_DIR/remote_deploy.sh"
# Fix CRLF line endings from Windows upload
sed -i 's/\r$//' "$PROJECT_DIR/remote_deploy.sh"

echo "--- [BOOTSTRAP] Executing main deployment script... ---"
cd "$PROJECT_DIR"
./remote_deploy.sh

echo "✅ [BOOTSTRAP] Success!"
