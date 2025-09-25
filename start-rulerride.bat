@echo off
echo 🚀 Starting RulerRide - Cross Network Setup
echo ============================================
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

REM Check if node_modules exists in backend
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd..
)

REM Check if node_modules exists in frontend
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

echo.
echo 🔧 Configuration Status:
echo ========================

REM Check .env file
if exist ".env" (
    echo ✅ .env file exists
    findstr /C:"EXPO_PUBLIC_MODE=public" .env >nul
    if %errorlevel%==0 (
        echo ✅ Public mode enabled - will use ngrok tunnel
    ) else (
        echo ⚠️  Local mode - will work on same network only
    )
) else (
    echo ❌ .env file missing!
    echo    Please create .env file with proper configuration
    pause
    exit /b 1
)

echo.
echo 🎯 Starting Services:
echo =====================

REM Start backend server
echo 🚀 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Check if ngrok is available and start tunnel
echo 🌐 Starting ngrok tunnel...
start "Ngrok Tunnel" cmd /k "echo Starting ngrok tunnel for cross-network access... && ngrok http 3001"

REM Wait for ngrok to initialize
echo ⏳ Waiting for ngrok to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 📱 Starting Expo Development Server:
echo ===================================
echo 🎯 Starting Expo with LAN access...

REM Start Expo with LAN mode for better network compatibility
npx expo start --lan

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo 📋 Next Steps:
echo 1. ✅ Backend is running on port 3001
echo 2. ✅ Ngrok tunnel is active for public access
echo 3. ✅ Expo is running with LAN mode
echo 4. 📱 Scan the QR code with Expo Go app
echo 5. 🌐 Your app will connect via ngrok tunnel
echo.
echo 🔧 Troubleshooting:
echo - If QR scan fails, ensure your device has internet
echo - Check ngrok terminal for the tunnel URL
echo - Backend uses MongoDB Atlas (cloud) - no local DB needed
echo.
echo Press any key to exit...
pause >nul