@echo off
setlocal
cd /d "%~dp0"

echo [0/4] Validating .env values...
set HAS_ENV_ERROR=0

findstr /C:"YOUR_PROJECT.supabase.co" .env >nul && (
	echo - SUPABASE_URL is still placeholder. Set your real Supabase project URL.
	set HAS_ENV_ERROR=1
)

findstr /C:"YOUR_SUPABASE_ANON_KEY" .env >nul && (
	echo - SUPABASE_ANON_KEY is still placeholder.
	set HAS_ENV_ERROR=1
)

findstr /C:"YOUR_SUPABASE_SERVICE_ROLE_KEY" .env >nul && (
	echo - SUPABASE_SERVICE_ROLE_KEY is still placeholder.
	set HAS_ENV_ERROR=1
)

findstr /C:"db.YOUR_PROJECT_REF.supabase.co" .env >nul && (
	echo - SUPABASE_DB_HOST is still placeholder.
	set HAS_ENV_ERROR=1
)

findstr /C:"YOUR_DB_PASSWORD" .env >nul && (
	echo - SUPABASE_DB_PASSWORD is still placeholder.
	set HAS_ENV_ERROR=1
)

findstr /C:"CHANGE_THIS_TO_A_LONG_RANDOM_SECRET" .env >nul && (
	echo - JWT_SECRET is still placeholder.
	set HAS_ENV_ERROR=1
)

findstr /C:"ChangeThis123!" .env >nul && (
	echo - ONLINE_ADMIN_PASSWORD is default. Change it.
	set HAS_ENV_ERROR=1
)

findstr /C:"CHANGE_THIS_BOOTSTRAP_KEY" .env >nul && (
	echo - BOOTSTRAP_ADMIN_KEY is still placeholder.
	set HAS_ENV_ERROR=1
)

if "%HAS_ENV_ERROR%"=="1" (
	echo.
	echo Fix .env first, then run setup-online.bat again.
	exit /b 1
)

echo [1/4] Installing packages...
call npm install
if errorlevel 1 goto :fail

echo [2/4] Applying PostgreSQL schema...
call npm run db:apply-schema
if errorlevel 1 goto :fail

echo [3/4] Bootstrapping online instance + admin...
call npm run setup:online
if errorlevel 1 goto :fail

echo [4/4] Done. Starting API server...
call npm run api:dev
if errorlevel 1 goto :fail

goto :eof

:fail
echo.
echo Setup failed. Check your .env values (especially Supabase DB + Redis).
exit /b 1
