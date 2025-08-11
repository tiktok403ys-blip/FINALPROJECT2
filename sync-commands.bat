@echo off
echo =================================
echo    PROJECT2 SYNC COMMANDS
echo =================================
echo.
echo [1] Pull latest changes (Before starting work)
echo [2] Quick commit and push (After debugging)
echo [3] Check status
echo [4] View recent commits
echo.
set /p choice="Choose option (1-4): "

if "%choice%"=="1" (
    echo Pulling latest changes...
    git pull origin main
    echo.
    echo ✅ Synced with latest changes!
    pause
)

if "%choice%"=="2" (
    set /p message="Commit message: "
    git add .
    git commit -m "%message%"
    git push origin main
    echo.
    echo ✅ Changes pushed to GitHub!
    pause
)

if "%choice%"=="3" (
    git status
    echo.
    pause
)

if "%choice%"=="4" (
    git log --oneline -10
    echo.
    pause
)
