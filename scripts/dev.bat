@echo off
chcp 65001 >nul
title SparkOS - Development Server

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     💻 SparkOS - Dev Server 💻           ║
echo  ╚═══════════════════════════════════════════╝
echo.

:: Check for node_modules
if not exist "node_modules" (
    echo  ⚠️  node_modules not found. Running npm install...
    call npm install
)

echo  🔥 Starting development server...
echo  ────────────────────────────────────────────
echo  Press Ctrl+C to stop the server
echo.

call npm run dev
