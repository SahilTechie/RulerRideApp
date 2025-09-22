import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the appropriate API URL based on platform and environment
 * For mobile devices (Android/iOS), use the local network IP
 * For web, use localhost
 */
const getApiUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
      // Web platform uses localhost
      return process.env.EXPO_PUBLIC_API_URL_WEB || 'http://localhost:3001';
    } else {
      // Mobile platforms (Android/iOS) use local network IP
      return process.env.EXPO_PUBLIC_API_URL || 'http://10.67.84.82:3001';
    }
  } else {
    // Production mode - you can set this to your production server URL
    return Constants.expoConfig?.extra?.apiUrl || 'http://10.67.84.82:3001';
  }
};

/**
 * Get the appropriate Socket URL based on platform and environment
 */
const getSocketUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
      // Web platform uses localhost
      return process.env.EXPO_PUBLIC_SOCKET_URL_WEB || 'http://localhost:3001';
    } else {
      // Mobile platforms (Android/iOS) use local network IP
      return process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.67.84.82:3001';
    }
  } else {
    // Production mode - you can set this to your production server URL
    return Constants.expoConfig?.extra?.socketUrl || 'http://10.67.84.82:3001';
  }
};

// Export the URLs
export const API_BASE_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();

// Debug logs for development
if (__DEV__) {
  console.log('🔧 API Configuration:');
  console.log('📱 Platform:', Platform.OS);
  console.log('🌐 API URL:', API_BASE_URL);
  console.log('🔌 Socket URL:', SOCKET_URL);
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
      },
      timeout: 5000,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connection successful:', data);
      return { success: true, data };
    } else {
      console.log('❌ Backend connection failed:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('🚫 Backend connection error:', error.message);
    return { success: false, error: error.message };
  }
};
