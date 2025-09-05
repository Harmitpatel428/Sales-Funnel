@echo off
echo 🌐 Starting Sales Funnel Web Application...
echo.

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔨 Building static files...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build application
    pause
    exit /b 1
)

echo.
echo 🌍 Starting local web server...
echo 📍 Application will be available at: http://localhost:3000
echo 📍 Press Ctrl+C to stop the server
echo.

cd out
python -m http.server 3000
