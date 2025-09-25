import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the appropriate API URL based on platform and environment
 * Supports both local development and public access via ngrok
 */
const getApiUrl = () => {
  const mode = process.env.EXPO_PUBLIC_MODE || 'local';
  
  if (mode === 'public') {
    // Public mode - use tunnel URL for any network access
    return process.env.EXPO_PUBLIC_API_URL_PUBLIC || 'https://your-tunnel-url.ngrok.io';
  } else if (mode === 'hotspot') {
    // Hotspot mode - use mobile hotspot IP
    return process.env.EXPO_PUBLIC_API_URL_HOTSPOT || 'http://172.19.247.171:3001';
  } else {
    // Local mode - mobile platforms use local network IP
    if (__DEV__) {
      return process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://10.67.84.82:3001';
    } else {
      // Production mode
      return Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL_PUBLIC;
    }
  }
};

/**
 * Get the appropriate Socket URL based on platform and environment
 */
const getSocketUrl = () => {
  const mode = process.env.EXPO_PUBLIC_MODE || 'local';
  
  if (mode === 'public') {
    // Public mode - use tunnel URL for any network access
    return process.env.EXPO_PUBLIC_SOCKET_URL_PUBLIC || 'https://your-tunnel-url.ngrok.io';
  } else if (mode === 'hotspot') {
    // Hotspot mode - use mobile hotspot IP
    return process.env.EXPO_PUBLIC_SOCKET_URL_HOTSPOT || 'http://172.19.247.171:3001';
  } else {
    // Local mode - platform-specific URLs
    if (__DEV__) {
      // Mobile platforms use local network IP
      return process.env.EXPO_PUBLIC_SOCKET_URL_LOCAL || 'http://10.67.84.82:3001';
    } else {
      // Production mode
      return Constants.expoConfig?.extra?.socketUrl || process.env.EXPO_PUBLIC_SOCKET_URL_PUBLIC;
    }
  }
};

// Export the URLs
export const API_BASE_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();

// Debug logs for development
if (__DEV__) {
  console.log('🔧 API Configuration:');
  console.log('📱 Platform:', Platform.OS);
  console.log('🔄 Mode:', process.env.EXPO_PUBLIC_MODE || 'local');
  console.log('🌐 API URL:', API_BASE_URL);
  console.log('🔌 Socket URL:', SOCKET_URL);
  
  if (process.env.EXPO_PUBLIC_MODE === 'public') {
    console.log('🌍 Using PUBLIC mode - accessible from any network via tunnel');
  } else if (process.env.EXPO_PUBLIC_MODE === 'hotspot') {
    console.log('📱 Using HOTSPOT mode - accessible via mobile hotspot');
  } else {
    console.log('🏠 Using LOCAL mode - same WiFi only');
  }
}

// API Endpoints
export const API_ENDPOINTS = {
  health: '/health',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    verify: '/auth/verify',
    logout: '/auth/logout',
    refresh: '/auth/refresh'
  },
  user: {
    profile: '/user/profile',
    updateLocation: '/user/location',
    savedLocations: '/user/saved-locations'
  },
  rides: {
    create: '/rides',
    get: '/rides',
    update: '/rides',
    cancel: '/rides/cancel',
    history: '/rides/history'
  },
  payments: {
    createOrder: '/payments/create-order',
    verify: '/payments/verify',
    methods: '/payments/methods'
  },
  sos: {
    create: '/sos/alert',
    update: '/sos/alert'
  }
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Test connectivity function
export const testConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await fetch(buildApiUrl(API_ENDPOINTS.health), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        'User-Agent': 'RulerRide-App/1.0.0',
      },
      timeout: 10000, // Increased timeout
    });

    if (response.ok) {
      const text = await response.text();
      console.log('📄 Raw response:', text.substring(0, 200) + '...');
      
      try {
        const data = JSON.parse(text);
        console.log('✅ Backend connection successful:', data);
        return { success: true, data };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was not JSON:', text.substring(0, 500));
        return { success: false, error: 'Invalid JSON response' };
      }
    } else {
      console.log('❌ Backend connection failed:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('🚫 Backend connection error:', error.message);
    return { success: false, error: error.message };
  }
};
