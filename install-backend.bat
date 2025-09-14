@echo off
echo 🚀 Installing RulerRide Backend Dependencies...
echo.

cd backend

echo 📦 Removing Twilio and installing Firebase...
npm uninstall twilio
npm install firebase-admin@^11.10.1

echo.
echo 📦 Installing remaining Node.js packages...
npm install

echo.
echo ✅ Dependencies installed successfully!
echo.
echo 🔧 To start the backend server:
echo    cd backend
echo    npm run dev
echo.
echo 📋 Make sure to:
echo    1. Install MongoDB locally or set up MongoDB Atlas
echo    2. Update .env file with your Firebase configuration
echo    3. Download Firebase service account JSON from Firebase Console
echo    4. Configure Razorpay for payments
echo    5. Set FIREBASE_PROJECT_ID in .env file
echo.

pause