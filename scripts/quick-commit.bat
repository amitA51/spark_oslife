@echo off
chcp 65001 >nul
title SparkOS - Quick Commit

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ⚡ SparkOS - Quick Commit ⚡          ║
echo  ╚═══════════════════════════════════════════╝
echo.

:: Show status
echo  📋 Current changes:
echo  ────────────────────────────────────────────
git status -s
echo.

:: Get commit message
set /p commit_msg="📝 Commit message: "
if "%commit_msg%"=="" (
    echo  ❌ Commit message is required!
    pause
    exit /b 1
)

echo.
git add .
git commit -m "%commit_msg%"
git push

echo.
echo  ✅ Committed and pushed!
pause
