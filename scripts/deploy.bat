@echo off
echo ==========================================
echo  Spark OS - Auto Deploy to GitHub
echo ==========================================
echo.

echo 1. Adding all changes...
git add .

echo.
set /p commit_msg="Enter commit message (Press Enter for 'Update'): "
if "%commit_msg%"=="" set commit_msg=Update

echo.
echo 2. Committing changes with message: "%commit_msg%"...
git commit -m "%commit_msg%"

echo.
echo 3. Pushing to GitHub...
git push

echo.
echo ==========================================
echo  Done! Vercel will now update automatically.
echo ==========================================
pause
