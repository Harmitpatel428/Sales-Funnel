@echo off
echo Starting Auto-commit Process...
echo This will automatically commit and push changes every 5 minutes
echo Press Ctrl+C to stop
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start-autocommit.ps1"

pause
