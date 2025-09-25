# 🚀 RulerRide Cross-Network Setup Guide

Follow these steps to make your Android app connect from any network (mobile data, different WiFi).

## 🎯 Quick Start with ngrok

### 1. Get ngrok Account (Free)
1. Visit: https://dashboard.ngrok.com/signup
2. Sign up for free account
3. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken

### 2. Configure ngrok
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 3. Start Backend Server
```bash
cd backend
npm start
```
✅ Should show: `🚗 RulerRide Backend Server is running on 0.0.0.0:3001`

### 4. Start ngrok Tunnel
```bash
# In a new terminal
ngrok http 3001
```

You'll see output like:
```
Forwarding    https://abc123def.ngrok.io -> http://localhost:3001
```

### 5. Update .env File
Copy the ngrok URL and update your `.env`:
```env
# Update with your actual ngrok URL
EXPO_PUBLIC_API_URL_PUBLIC=https://abc123def.ngrok.io
EXPO_PUBLIC_SOCKET_URL_PUBLIC=https://abc123def.ngrok.io

# Switch to public mode
EXPO_PUBLIC_MODE=public
```

### 6. Start Expo
```bash
npx expo start --lan
```

### 7. Test on Android
- Open Expo Go app
- Scan the QR code
- App will connect via ngrok URL
- Works on mobile data or any WiFi!

## 🔧 Alternative: Mobile Hotspot Method

If you don't want to use ngrok:

1. **Enable mobile hotspot** on your phone
2. **Connect laptop** to phone's hotspot WiFi
3. **Find laptop's IP** on hotspot network:
   ```bash
   ipconfig | findstr "IPv4"
   ```
4. **Update .env:**
   ```env
   EXPO_PUBLIC_API_URL_HOTSPOT=http://YOUR_HOTSPOT_IP:3001
   EXPO_PUBLIC_SOCKET_URL_HOTSPOT=http://YOUR_HOTSPOT_IP:3001
   EXPO_PUBLIC_MODE=hotspot
   ```

## 📱 Testing Checklist

✅ Backend shows: `Server accessible from any network when tunneled`
✅ ngrok shows: `Forwarding https://xxx.ngrok.io -> http://localhost:3001`
✅ .env has correct ngrok URL
✅ EXPO_PUBLIC_MODE=public
✅ Expo app logs show ngrok URL in API configuration

## 🔍 Troubleshooting

### ngrok Authentication Error
```bash
ERROR: authentication failed
```
**Solution:** Get authtoken from dashboard and run:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### Backend Not Accessible
Check if backend is running on `0.0.0.0:3001` not just `localhost:3001`

### CORS Errors
Your backend is already configured with:
```javascript
app.use(cors({
  origin: true, // Allows all origins in development
  credentials: true
}));
```

### App Still Uses Local URL
Check Expo logs for:
```
🔧 API Configuration:
🔄 Mode: public
🌐 API URL: https://your-ngrok-url.ngrok.io
```

## 🚀 Production Notes

For production deployment, replace ngrok with:
- **Heroku**: Free tier available
- **Railway**: Easy deployment
- **Vercel**: Great for API routes
- **DigitalOcean**: VPS hosting

Update your .env with production URL:
```env
EXPO_PUBLIC_API_URL_PUBLIC=https://your-app.herokuapp.com
EXPO_PUBLIC_MODE=public
```