@echo off
setlocal

echo Checking port 4000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do (
  set PID=%%a
)

if not defined PID (
  echo No process is using port 4000.
  goto :eof
)

echo Killing PID %PID% on port 4000...
taskkill /PID %PID% /F
if errorlevel 1 (
  echo Failed to kill PID %PID%.
  exit /b 1
)

echo Port 4000 should now be free.
