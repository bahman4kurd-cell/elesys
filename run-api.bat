@echo off
setlocal
cd /d "%~dp0"

call npm run api:dev
if errorlevel 1 exit /b 1
