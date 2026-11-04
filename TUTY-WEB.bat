@echo off
setlocal
cd /d "%~dp0"
call "%~dp0src\web\start.bat" %*
