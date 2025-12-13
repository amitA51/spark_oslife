@echo off
chcp 65001 >nul
title SparkOS - Run Tests

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     🧪 SparkOS - Run Tests 🧪            ║
echo  ╚═══════════════════════════════════════════╝
echo.

echo  Choose test mode:
echo  ────────────────────────────────────────────
echo  [1] Run tests once
echo  [2] Run tests with coverage
echo  [3] Run tests in watch mode
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo  🧪 Running tests...
    call npm run test -- --run
) else if "%choice%"=="2" (
    echo.
    echo  📊 Running tests with coverage...
    call npm run test:coverage
) else if "%choice%"=="3" (
    echo.
    echo  👀 Running tests in watch mode...
    call npm run test
) else (
    echo  ❌ Invalid choice!
)

pause
