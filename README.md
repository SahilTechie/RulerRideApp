# RulerRide (RIDER APP)🚗

A modern ride-sharing mobile application built with React Native and Expo, featuring real-time ride booking, user authentication, and payment integration.

## 🎯 Latest Update - Android Device Ready! 

✅ **Successfully configured for real Android device testing**
- App now works on physical Android devices via Expo Go
- Backend configured for mobile network connectivity
- OTP authentication fully functional on mobile
- Ready for APK/AAB build generation

## Mobile App for Rider's
<div align="center"> <!-- ROW 1 — 4 Images --> <table> <tr> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/ec7b3d14-258f-422a-9d80-5ef73a3ee349" /></td> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/113f2660-1a0f-4e0d-85c6-407c2a1b421b" /></td> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/630a2612-270f-46c7-b761-a885b567c574" /></td> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/d16f0b06-4517-44c9-b0d7-2e612fd5b415" /></td> </tr> </table> <!-- ROW 2 — 3 Images --> <table> <tr> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/aed0ccde-54d8-40d8-9878-beda1f6d9dd6" /></td> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/ac78ace7-c093-46f1-b39f-3afdb258c000" /></td> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/222a67f7-6785-44de-b047-fc6ab95f656d" /></td> </tr> </table> <!-- ROW 3 — 2 Images --> <table> <tr> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/46973f61-dd55-41b7-83c7-805596c21537" /></td> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/b254455e-94b9-413e-8df7-71099ac6095a" /></td> </tr> </table> <!-- ROW 4 — 1 Image --> <table> <tr> <td><img width="260" height="520" src="https://github.com/user-attachments/assets/de7aec56-b03c-4f61-93b9-1e5f17e8bfc9" /></td> </tr> </table> </div>


## 🚧 Development Status

**This project is currently under active development** - features are being implemented and refined. All core functionality is working on both web and mobile platforms.

## ✨ Features

- 📱 Cross-platform mobile app (iOS & Android) ✅ **WORKING**
- 🔐 User authentication & registration ✅ **WORKING** 
- 📍 Real-time location tracking ✅ **WORKING**
- 🚕 Ride booking and management 🔄 **IN PROGRESS**
- 💳 Payment methods integration ✅ **BACKEND READY**
- 📊 Ride history tracking 🔄 **IN PROGRESS**
- 🆘 Emergency SOS functionality ✅ **BACKEND READY**
- 🔔 Push notifications 🔄 **PLANNED**
- 👤 User profile management ✅ **WORKING**

## 📱 Mobile Testing

### Expo Go (Recommended for Testing)
1. Install Expo Go from Play Store/App Store
2. Connect to same WiFi as development machine
3. Scan QR code from `npx expo start --lan`
4. App connects to backend at `10.67.84.82:3001`

### APK/AAB Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build APK for testing
eas build -p android --profile preview

# Build AAB for production
eas build -p android --profile production
```

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Firebase** for authentication & real-time features
- **React Native Maps** for location services

### Backend
- **Node.js** with Express
- **MongoDB** for database
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Firebase Admin** for push notifications

## 📁 Project Structure

```
├── app/                 # React Native screens
├── components/          # Reusable UI components
├── services/           # API and service layers
├── backend/            # Node.js backend server
├── assets/             # Images and animations
└── config/             # Configuration files
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- MongoDB
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SahilTechie/RulerRideApp.git
   cd RulerRideApp
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Setup environment variables**
   - Configure Firebase credentials
   - Set up MongoDB connection
   - Add required API keys

5. **Start the development servers**
   ```bash
   # Start backend server
   cd backend
   npm start
   
   # Start Expo development server (in new terminal)
   npx expo start
   ```

## 🔧 Configuration

Refer to `INTEGRATION_GUIDE.md` for detailed setup instructions and API integration guidelines.

## 🤝 Contributing

This project is in active development. Contributions, suggestions, and feedback are welcome!

## 📄 License

This project is currently in development phase. License terms will be updated upon completion.

---

⚠️ **Note**: This application is still in development. Features may be incomplete and subject to changes.
