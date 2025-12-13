@echo off
chcp 65001 >nul
title SparkOS - Clean Install

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     🧹 SparkOS - Clean Install 🧹        ║
echo  ╚═══════════════════════════════════════════╝
echo.
echo  ⚠️  This will delete node_modules and reinstall.
echo.

set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" (
    echo  Cancelled.
    pause
    exit /b 0
)

echo.
echo  🗑️  [1/3] Removing node_modules...
if exist "node_modules" rmdir /s /q node_modules
echo  ✓ Done

echo.
echo  🗑️  [2/3] Removing package-lock.json...
if exist "package-lock.json" del /f package-lock.json
echo  ✓ Done

echo.
echo  📦 [3/3] Installing fresh dependencies...
echo  ────────────────────────────────────────────
call npm install

if %ERRORLEVEL% neq 0 (
    echo.
    echo  ❌ Installation failed!
    pause
    exit /b 1
)

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ✅ Clean install completed!           ║
echo  ╚═══════════════════════════════════════════╝
echo.
pause
