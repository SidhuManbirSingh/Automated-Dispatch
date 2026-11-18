@echo off
echo ================================================================================
echo   Guardteck Dispatch Console - Automated Launcher
echo ================================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js detected! Starting TypeScript/Fastify development server...
    if not exist "node_modules" (
        echo [INFO] Installing node modules...
        call npm install
    )
    npm run dev
) else (
    echo [NOTICE] Node.js is not in PATH. Falling back to Python 3.12 / FastAPI runtime...
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [OK] Python detected! Launching server.py...
        python server.py
    ) else (
        echo [ERROR] Neither Node.js nor Python was found.
        echo Please install Node.js via: winget install OpenJS.NodeJS.LTS
        pause
    )
)
