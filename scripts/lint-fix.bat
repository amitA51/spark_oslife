@echo off
chcp 65001 >nul
title SparkOS - Lint and Format

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ✨ SparkOS - Lint ^& Format ✨         ║
echo  ╚═══════════════════════════════════════════╝
echo.

echo  Choose action:
echo  ────────────────────────────────────────────
echo  [1] Check for lint errors (no fix)
echo  [2] Fix lint errors automatically
echo  [3] Check formatting
echo  [4] Fix formatting automatically
echo  [5] Fix ALL (lint + format)
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo  🔍 Checking for lint errors...
    call npm run lint
) else if "%choice%"=="2" (
    echo.
    echo  🔧 Fixing lint errors...
    call npm run lint:fix
) else if "%choice%"=="3" (
    echo.
    echo  🔍 Checking formatting...
    call npm run format:check
) else if "%choice%"=="4" (
    echo.
    echo  🔧 Fixing formatting...
    call npm run format
) else if "%choice%"=="5" (
    echo.
    echo  🔧 Fixing lint errors...
    call npm run lint:fix
    echo.
    echo  🔧 Fixing formatting...
    call npm run format
    echo.
    echo  ✅ All fixes applied!
) else (
    echo  ❌ Invalid choice!
)

pause
