# 🌐 RulerRide Cross-Network Access Guide

This guide provides multiple methods to make RulerRide work from any network (mobile data, different WiFi).

## 🎯 Quick Solutions

### Method 1: Mobile Hotspot (Recommended - No Setup Required)

**Steps:**
1. **Enable mobile hotspot** on your Android phone
2. **Connect your laptop** to the phone's hotspot
3. **Find your laptop's new IP** on the hotspot network:
   ```bash
   ipconfig | findstr "IPv4"
   ```
4. **Update .env file:**
   ```env
   EXPO_PUBLIC_API_URL_HOTSPOT=http://YOUR_HOTSPOT_IP:3001
   EXPO_PUBLIC_SOCKET_URL_HOTSPOT=http://YOUR_HOTSPOT_IP:3001
   EXPO_PUBLIC_MODE=hotspot
   ```
5. **Start backend and Expo:**
   ```bash
   # Terminal 1: Start backend
   cd backend && npm start
   
   # Terminal 2: Start Expo
   npx expo start --lan
   ```
6. **Test on the same phone** providing the hotspot

### Method 2: ngrok Tunnel (Requires Free Account)

**Steps:**
1. **Sign up at [ngrok.com](https://dashboard.ngrok.com/signup)**
2. **Get your authtoken** from dashboard
3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
4. **Start tunnel:**
   ```bash
   ngrok http 3001
   ```
5. **Copy the https URL** (e.g., `https://abc123.ngrok.io`)
6. **Update .env:**
   ```env
   EXPO_PUBLIC_API_URL_PUBLIC=https://abc123.ngrok.io
   EXPO_PUBLIC_SOCKET_URL_PUBLIC=https://abc123.ngrok.io
   EXPO_PUBLIC_MODE=public
   ```

### Method 3: Local Network with Port Forwarding

**Steps:**
1. **Enable port forwarding** on your router for port 3001
2. **Find your public IP:** Visit [whatismyipaddress.com](https://whatismyipaddress.com)
3. **Update .env:**
   ```env
   EXPO_PUBLIC_API_URL_PUBLIC=http://YOUR_PUBLIC_IP:3001
   EXPO_PUBLIC_SOCKET_URL_PUBLIC=http://YOUR_PUBLIC_IP:3001
   EXPO_PUBLIC_MODE=public
   ```

## � Configuration Modes

### Local Mode (Same WiFi)
```env
EXPO_PUBLIC_MODE=local
```
- Uses local network IP: `10.67.84.82:3001`
- Works only when both devices on same WiFi

### Hotspot Mode (Mobile Hotspot)
```env
EXPO_PUBLIC_MODE=hotspot
```
- Uses hotspot network IP
- Perfect for testing on mobile data
- No external services required

### Public Mode (Tunnel/Port Forwarding)
```env
EXPO_PUBLIC_MODE=public
```
- Uses public URL or tunneled connection
- Works from any network globally