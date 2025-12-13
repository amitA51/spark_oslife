@echo off
chcp 65001 >nul
title SparkOS - Firebase Deploy

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     🚀 SparkOS - Firebase Deploy 🚀      ║
echo  ╚═══════════════════════════════════════════╝
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo  ❌ Error: package.json not found!
    echo  Make sure you're in the sparkos directory.
    pause
    exit /b 1
)

:: Check for node_modules
if not exist "node_modules" (
    echo  ⚠️  node_modules not found. Running npm install first...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo  ❌ npm install failed!
        pause
        exit /b 1
    )
)

echo  📦 [1/2] Building the project...
echo  ────────────────────────────────────────────
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ❌ Build failed! Please fix the errors and try again.
    pause
    exit /b 1
)

echo.
echo  ☁️  [2/2] Deploying to Firebase...
echo  ────────────────────────────────────────────
call firebase deploy
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ❌ Firebase deploy failed!
    pause
    exit /b 1
)

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ✅ Deploy completed successfully!     ║
echo  ╚═══════════════════════════════════════════╝
echo.
pause
