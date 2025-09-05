@echo off
echo 🚀 Building Sales Funnel Desktop Application...
echo.

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔨 Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build Next.js app
    pause
    exit /b 1
)

echo.
echo ⚡ Building Electron application...
call npm run dist
if %errorlevel% neq 0 (
    echo ❌ Failed to build Electron app
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo 📁 Check the 'dist' folder for the installer
echo.
pause
