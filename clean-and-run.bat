#!/bin/bash
# 🔧 پاک کردنی و دووبارە کردنی پرۆژە

echo "🧹 پاک کردن..."
if exist "dist" rmdir /s /q dist
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

echo "📦 دامەزرێنە..."
call npm install

echo "✅ کۆمپایل کردن..."
call npm run build

echo "🚀 سەرڤەر کردن..."
call npm run dev

echo "🌐 براوسەر: http://localhost:3001"
pause
