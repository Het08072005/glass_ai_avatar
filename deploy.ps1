# Professional One-Click AWS Deployment Script
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"
$ServerIP = "34.235.32.139"
$Key = "ai_avatar.pem"
$User = "ubuntu"
$RemoteDir = "/home/ubuntu/final_ecommerce_beyond"

# 1. Clean Staging
$TempDir = ".deploy_staging"
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
Write-Host "📦 Staging files..." -ForegroundColor Cyan
Copy-Item "backend", "frontend", "Caddyfile", "remote_deploy.sh" -Destination $TempDir -Recurse
if (Test-Path "ai_avatar.pem") { Copy-Item "ai_avatar.pem" -Destination $TempDir }

# Cleanup Junk
Remove-Item "$TempDir\backend\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue 
Remove-Item "$TempDir\backend\.venv" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$TempDir\frontend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$TempDir\frontend\.git" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$TempDir\frontend\dist" -Recurse -Force -ErrorAction SilentlyContinue

# 2. Zip
$ZipFile = "project_deploy.zip"
if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }
Write-Host "🗜️ Zipping project..." -ForegroundColor Cyan
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipFile

# 3. Upload (Using variables to avoid syntax errors)
Write-Host "📤 Uploading Zip and Scripts..." -ForegroundColor Cyan

# Construct Remote Paths safely
$HomeTarget = "$User@$ServerIP" + ":/home/ubuntu/"
$BackendEnvTarget = "$User@$ServerIP" + ":$RemoteDir/backend/.env"
$FrontendEnvTarget = "$User@$ServerIP" + ":$RemoteDir/frontend/.env"

# Upload Zip
scp -i $Key -o StrictHostKeyChecking=no $ZipFile $HomeTarget
# Upload Bootstrap Script
scp -i $Key -o StrictHostKeyChecking=no bootstrap.sh $HomeTarget

# Upload Secrets
Write-Host "🔐 Uploading Secrets..." -ForegroundColor Cyan
scp -i $Key -o StrictHostKeyChecking=no backend/.env $BackendEnvTarget
scp -i $Key -o StrictHostKeyChecking=no frontend/.env $FrontendEnvTarget

# 4. Execute Remote Bootstrap
Write-Host "🚀 Triggering Remote Deployment..." -ForegroundColor Green
$SSH_Target = "$User@$ServerIP"
ssh -i $Key -o StrictHostKeyChecking=no $SSH_Target "chmod +x bootstrap.sh; ./bootstrap.sh"

# Cleanup Local
Remove-Item $TempDir -Recurse -Force
Remove-Item $ZipFile -Force
Write-Host "✅ DEPLOYMENT COMPLETE! Site: https://ui.34.235.32.139.nip.io" -ForegroundColor Green
