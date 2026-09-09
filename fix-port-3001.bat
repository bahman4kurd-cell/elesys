@echo off
setlocal

echo Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
  set PID=%%a
)

if not defined PID (
  echo No process is using port 3001.
  goto :eof
)

echo Killing PID %PID% on port 3001...
taskkill /PID %PID% /F
if errorlevel 1 (
  echo Failed to kill PID %PID%.
  exit /b 1
)

echo Port 3001 should now be free.
