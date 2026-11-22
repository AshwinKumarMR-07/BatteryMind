@echo off
title BatteryMind Universal Platform Launcher
echo ===================================================================
echo   BatteryMind - Universal EV Battery Health Intelligence Platform
echo ===================================================================
echo.
echo Checking Python environment...
set PYTHON_EXE=C:\Users\%USERNAME%\AppData\Local\Python\pythoncore-3.14-64\python.exe

if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo Starting BatteryMind unified server on http://localhost:8000 ...
start "" http://localhost:8000
"%PYTHON_EXE%" run_backend.py
pause
