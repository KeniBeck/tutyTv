@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo No encuentro Node.js. Instala Node.js 18 o superior desde https://nodejs.org/
    pause
    exit /b 1
)

node server.js %*
pause
