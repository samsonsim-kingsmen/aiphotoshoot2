@echo off
title NMS App Startup Script
color 0A

echo ========================================
echo    NMS App Startup Script (Fullscreen)
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%"

echo [INFO] Project directory: %PROJECT_DIR%
echo [INFO] Starting NMS App...
echo.

cd /d "%PROJECT_DIR%"

REM Check for package.json
if not exist "package.json" (
    echo [ERROR] package.json not found in %PROJECT_DIR%
    pause
    exit /b 1
)

REM Check for node_modules
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully
    echo.
)

REM Start the dev server in Git Bash
echo [INFO] Launching dev server...
start "NMS App - Dev Server" "C:\Program Files\Git\bin\bash.exe" -c "cd '%PROJECT_DIR%' && npm run dev"

REM Wait a bit for server to start
echo [INFO] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Define your app URL
set "APP_URL=http://localhost:3000"

REM Try to open in fullscreen kiosk mode
echo [INFO] Launching browser in fullscreen kiosk mode...

REM Try Microsoft Edge first
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk %APP_URL% --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --overscroll-history-navigation=0 --fast --start-fullscreen
    goto :done
)

REM Otherwise try Google Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk %APP_URL% --no-first-run --disable-pinch --overscroll-history-navigation=0 --fast --start-fullscreen
    goto :done
)


echo [WARNING] No supported browser (Edge/Chrome/Chromium) found.
echo [INFO] Opening normally in default browser...
start "" "%APP_URL%"

:done
echo.
echo [SUCCESS] App launched in fullscreen mode!
echo [INFO] Press ALT+F4 to exit fullscreen kiosk mode.
echo.
pause >nul
