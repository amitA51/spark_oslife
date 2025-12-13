@echo off
chcp 65001 >nul
title SparkOS - Full Deploy (GitHub + Firebase)

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║  🚀 SparkOS - Full Deploy 🚀             ║
echo  ║  (GitHub + Firebase)                      ║
echo  ╚═══════════════════════════════════════════╝
echo.

:: Get commit message
set /p commit_msg="📝 Commit message (Enter for 'Update'): "
if "%commit_msg%"=="" set commit_msg=Update

echo.
echo  📦 [1/5] Building the project...
echo  ────────────────────────────────────────────
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo  📁 [2/5] Staging changes...
git add .

echo.
echo  💾 [3/5] Committing: "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo  ⬆️  [4/5] Pushing to GitHub...
echo  ────────────────────────────────────────────
git push
if %ERRORLEVEL% neq 0 (
    echo  ⚠️  Git push failed (maybe nothing to push?)
)

echo.
echo  ☁️  [5/5] Deploying to Firebase...
echo  ────────────────────────────────────────────
call firebase deploy
if %ERRORLEVEL% neq 0 (
    echo  ❌ Firebase deploy failed!
    pause
    exit /b 1
)

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ✅ Full deploy completed!             ║
echo  ║  • GitHub: Updated                        ║
echo  ║  • Firebase: Deployed                     ║
echo  ╚═══════════════════════════════════════════╝
echo.
pause
