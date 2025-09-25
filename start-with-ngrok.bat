@echo off
echo 🚀 Starting RulerRide with ngrok tunnel...
echo.
echo ⚠️  IMPORTANT: You need a free ngrok account!
echo 1. Sign up at: https://dashboard.ngrok.com/signup
echo 2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
echo 3. Run: ngrok config add-authtoken YOUR_AUTHTOKEN
echo.
pause

echo 🔧 Starting backend server...
start cmd /k "cd backend && npm start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🌐 Starting ngrok tunnel...
echo Copy the https URL from ngrok and update your .env file!
echo.
ngrok http 3001