@echo off
title Campus Hub
cd /d "%~dp0"

if not exist "node_modules\concurrently" (
  echo Installing root dependencies...
  call npm install
)

if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  call npm install --prefix backend
)

if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  call npm install --prefix frontend --legacy-peer-deps
)

if not exist "mobile-expo\node_modules" (
  echo Installing mobile dependencies...
  call npm install --prefix mobile-expo
)

echo.
echo Starting Campus Hub (API + Web + Mobile)...
echo.
call npm start

pause
