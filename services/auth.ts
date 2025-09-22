import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, ApiResponse } from './api';

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  role: 'rider' | 'driver';
  email?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  rideHistory: string[];
  isVerified: boolean;
  fcmToken?: string;
}

export interface AuthResponse {
  user: RiderProfile;
  accessToken: string;
  refreshToken: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export class AuthService {
  // Send OTP to phone number
  static async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      console.log(`📱 Sending OTP to ${phoneNumber}`);
      
      const response = await apiService.post<OTPResponse>('/auth/send-otp', {
        phoneNumber: phoneNumber
      }, false); // No auth required for sending OTP

      if (response.success && response.data) {
        // Store phone number for verification
        await AsyncStorage.setItem('pending_phone', phoneNumber);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP and sign in
  static async verifyOTP(verificationId: string, otp: string): Promise<AuthResponse> {
    try {
      const phoneNumber = await AsyncStorage.getItem('pending_phone');
      
      if (!phoneNumber) {
        throw new Error('Phone number not found. Please request OTP again.');
      }

      console.log(`🔐 Verifying OTP for ${phoneNumber}`);

      const response = await apiService.post<AuthResponse>('/auth/verify-otp', {
        phoneNumber: phoneNumber,
        otp: otp
      }, false); // No auth required for OTP verification

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store auth tokens and user data
        const storageItems: [string, string][] = [
          ['auth_token', accessToken],
          ['user_data', JSON.stringify(user)],
        ];

        // Only store refresh token if it exists
        if (refreshToken) {
          storageItems.push(['refresh_token', refreshToken]);
        }

        await AsyncStorage.multiSet(storageItems);

        // Clear pending phone
        await AsyncStorage.removeItem('pending_phone');

        console.log('✅ Authentication successful');
        return response.data;
      } else {
        throw new Error(response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP. Please try again.');
    }
  }

  // Create or get rider profile
  static async createOrGetRiderProfile(phoneNumber: string): Promise<RiderProfile> {
    try {
      console.log(`👤 Creating/getting profile for ${phoneNumber}`);

      const response = await apiService.post<RiderProfile>('/auth/register', {
        phone: phoneNumber,
        role: 'rider'
      }, false); // No auth required for registration

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create user profile');
      }
    } catch (error: any) {
      console.error('Error creating rider profile:', error);
      throw new Error(error.message || 'Failed to create user profile. Please try again.');
    }
  }

  // Update rider profile
  static async updateRiderProfile(updates: Partial<RiderProfile>): Promise<RiderProfile> {
    try {
      console.log('📝 Updating user profile');

      const response = await apiService.put<RiderProfile>('/users/profile', updates);

      if (response.success && response.data) {
        // Update stored user data
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating rider profile:', error);
      throw new Error(error.message || 'Failed to update profile. Please try again.');
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<RiderProfile | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }

      // Try to get user from backend if local data is missing
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await apiService.get<RiderProfile>('/users/profile');
        if (response.success && response.data) {
          await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
          return response.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return false;

      // Verify token with backend
      const response = await apiService.get('/auth/verify-token');
      return response.success;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  // Refresh auth token
  static async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<{ accessToken: string }>('/auth/refresh-token', {
        refreshToken
      }, false);

      if (response.success && response.data) {
        await AsyncStorage.setItem('auth_token', response.data.accessToken);
        return response.data.accessToken;
      } else {
        throw new Error(response.message || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth data if refresh fails
      await this.logout();
      return null;
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      // Inform backend about logout
      try {
        await apiService.post('/auth/logout');
      } catch (error) {
        // Ignore backend logout errors
        console.warn('Backend logout failed:', error);
      }

      // Clear local storage
      await AsyncStorage.multiRemove([
        'auth_token', 
        'refresh_token', 
        'user_data', 
        'pending_phone'
      ]);

      console.log('🚪 User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  }

  // Update FCM token for push notifications
  static async updateFCMToken(fcmToken: string): Promise<void> {
    try {
      const response = await apiService.put('/users/fcm-token', {
        fcmToken
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update FCM token');
      }

      console.log('🔔 FCM token updated successfully');
    } catch (error: any) {
      console.error('Error updating FCM token:', error);
      throw new Error(error.message || 'Failed to update notification settings.');
    }
  }

  // Resend OTP
  static async resendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      console.log(`🔄 Resending OTP to ${phoneNumber}`);
      
      const response = await apiService.post<OTPResponse>('/auth/resend-otp', {
        phone: phoneNumber
      }, false);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      throw new Error(error.message || 'Failed to resend OTP. Please try again.');
    }
  }
}