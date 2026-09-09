@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════╗
echo ║  🚀 Bahman-Darwish سیستەمی ئـامادەکردن     ║
echo ╚════════════════════════════════════════════╝
echo.

cd /d "d:\sytem app\dist\Bahman-Darwish-main\Bahman-Darwish-main"

echo 📍 تێستی npm...
npm --version >nul 2>&1

if errorlevel 1 (
    echo ❌ npm دامەزراندراو نیە! رۆ بۆ https://nodejs.org
    pause
    exit /b 1
)

echo 📍 دامەزرێنە مۆدیولەکان...
if not exist "node_modules" (
    call npm install
)

echo.
echo ╔════════════════════════════════════════════╗
echo ║  🚀 سەرڤەری دەکرێت - چاو بڪە:          ║
echo ║     http://localhost:3001                 ║
echo ║  لۆگین: ھر ناو/وشە (user/pass)           ║
echo ║  Ctrl+C: سەرڤەرَ داخستن                 ║
echo ╚════════════════════════════════════════════╝
echo.
title Kurdish Election Results System
echo ====================================================
echo دەستپێکردنی سیستەمی ئەنجامی هەڵبژاردنەکان (ئۆفلاین)...
echo ====================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [تێبینی] پرۆگرامی Node.js لەسەر کۆمپیوتەرەکەت نەدۆزرایەوە.
    echo تکایە Node.js لەم بەستەرە دابەزێنە: https://nodejs.org
    echo.
    pause
    exit /b
)

if not exist node_modules (
    echo دابەزاندنی پێداویستییەکانی سیستەم بۆ جاری یەکەم...
    call npm install
)

echo دروستکردنی نوێترین وەشانی سیستەمەکە...
call npm run build
if errorlevel 1 (
    echo [هەڵە] دروستکردنی سیستەم سەرکەوتوو نەبوو.
    pause
    exit /b 1
)

echo دەستپێکردنی سەرڤەری نوێ...
start "Kurdish Election Results System" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:3001
