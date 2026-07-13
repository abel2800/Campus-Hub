@echo off
title Campus Hub - Android USB setup
echo.
echo Connect your Android phone with USB debugging ON.
echo.
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
if %errorlevel% neq 0 (
  echo.
  echo adb failed. Install Android platform-tools or enable USB debugging.
  pause
  exit /b 1
)
echo.
echo OK! In Expo Go, enter this URL manually:
echo   exp://127.0.0.1:8081
echo.
pause
