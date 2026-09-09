@echo off
setlocal
cd /d "%~dp0"

echo Freeing API port 4000 if needed...
call fix-port-4000.bat

echo Freeing WEB port 3001 if needed...
call fix-port-3001.bat

echo Starting API on port 4000...
start "API" cmd /k npm run api:dev

timeout /t 2 >nul

echo Starting Vite frontend on port 3001...
start "WEB" cmd /k npm run dev

echo Both services started.
