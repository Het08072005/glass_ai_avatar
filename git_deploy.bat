@echo off
echo.
echo =========================================================
echo              GIT BACKUP & PUSH - STARTING
echo =========================================================

REM 1. Initialize backup branch
set TIMESTAMP=%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set BRANCH_NAME=aws-deploy-fix-%TIMESTAMP: =0%

echo [GIT] Creating new branch: %BRANCH_NAME%
git checkout -b %BRANCH_NAME%

echo [GIT] Adding all changes...
git add .

echo [GIT] Committing changes (AWS Deployment Fixes)...
git commit -m "feat: aws deployment automation, env fixes, and agent patches"

echo [GIT] Pushing branch to origin...
git push origin %BRANCH_NAME%

echo.
echo =========================================================
echo              GITHUB PUSH COMPLETE 
echo =========================================================
echo.
echo Now starting deployment to AWS...
python deploy.py
pause
