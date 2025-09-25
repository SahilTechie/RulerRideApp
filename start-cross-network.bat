@echo off
echo 🚀 Starting RulerRide with Cross-Network Access
echo.

REM Check if ngrok is installed
ngrok version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok not found. Installing...
    npm install -g ngrok
)

echo 🔑 Checking ngrok authentication...
ngrok config check > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  ngrok not authenticated. Please:
    echo 1. Visit: https://dashboard.ngrok.com/get-started/your-authtoken
    echo 2. Copy your authtoken
    echo 3. Run: ngrok config add-authtoken YOUR_AUTHTOKEN
    echo 4. Then run this script again
    pause
    exit /b 1
)

echo.
echo 🎯 Starting backend server...
cd backend
start cmd /k "npm start"

timeout /t 3 /nobreak > nul

echo 🌐 Starting ngrok tunnel...
cd..
start cmd /k "echo Starting ngrok tunnel... && ngrok http 3001"

timeout /t 5 /nobreak > nul

echo.
echo 📋 Setup Instructions:
echo 1. Wait for ngrok to show your URL (e.g., https://abc123.ngrok.io)
echo 2. Copy the https URL from ngrok terminal
echo 3. Update .env file:
echo    - EXPO_PUBLIC_API_URL_PUBLIC=your_ngrok_url
echo    - EXPO_PUBLIC_SOCKET_URL_PUBLIC=your_ngrok_url  
echo    - EXPO_PUBLIC_MODE=public
echo 4. Run: npx expo start --lan
echo 5. Test on Android device with mobile data!
echo.
echo 🔧 View full setup guide: CROSS_NETWORK_SETUP.md
pause