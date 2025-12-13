@echo off
chcp 65001 >nul
title SparkOS - Preview Production Build

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     👁️  SparkOS - Preview Build 👁️        ║
echo  ╚═══════════════════════════════════════════╝
echo.

echo  📦 [1/2] Building for production...
echo  ────────────────────────────────────────────
call npm run build
if %ERRORLEVEL% neq 0 (
    echo  ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo  🌐 [2/2] Starting preview server...
echo  ────────────────────────────────────────────
echo  This shows exactly what will be deployed.
echo  Press Ctrl+C to stop.
echo.

call npm run preview
