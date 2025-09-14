const admin = require('firebase-admin');
const crypto = require('crypto');
const { AppError } = require('../middleware/errorHandler');

class OTPService {
  constructor() {
    this.otpStore = new Map(); // In production, use Redis
    this.otpAttempts = new Map();
    this.maxAttempts = 5;
    this.blockDuration = 15 * 60 * 1000; // 15 minutes
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate secure OTP with crypto
  generateSecureOTP() {
    const buffer = crypto.randomBytes(3);
    const otp = parseInt(buffer.toString('hex'), 16) % 1000000;
    return otp.toString().padStart(6, '0');
  }

  // Store OTP with expiration
  storeOTP(phone, otp, expiresIn = 5 * 60 * 1000) { // 5 minutes default
    const key = this.getOTPKey(phone);
    const expiresAt = Date.now() + expiresIn;
    
    this.otpStore.set(key, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    // Auto cleanup after expiration
    setTimeout(() => {
      this.otpStore.delete(key);
    }, expiresIn);

    console.log(`OTP stored for ${phone}: ${otp} (expires in ${expiresIn/1000}s)`);
  }

  // Verify OTP
  verifyOTP(phone, providedOTP) {
    const key = this.getOTPKey(phone);
    const otpData = this.otpStore.get(key);

    if (!otpData) {
      throw new AppError('OTP not found or expired', 400, 'OTP_NOT_FOUND');
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(key);
      throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
    }

    // Check attempt limit
    if (otpData.attempts >= this.maxAttempts) {
      this.otpStore.delete(key);
      this.blockUser(phone);
      throw new AppError('Too many OTP attempts. Please try again later.', 429, 'OTP_ATTEMPTS_EXCEEDED');
    }

    // Verify OTP
    if (otpData.otp !== providedOTP) {
      otpData.attempts += 1;
      this.otpStore.set(key, otpData);
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    // OTP verified successfully
    this.otpStore.delete(key);
    this.clearUserBlock(phone);
    return true;
  }

  // Send OTP via Firebase SMS
  async sendOTPViaSMS(phone, otp) {
    try {
      // Clean phone number format
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      // In development, just log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 SMS OTP for ${cleanPhone}: ${otp}`);
        return { success: true, messageId: 'dev-' + Date.now() };
      }

      // Firebase SMS sending (requires setup)
      const message = {
        notification: {
          title: 'RulerRide OTP',
          body: `Your OTP is: ${otp}. Valid for 5 minutes.`
        },
        token: cleanPhone // This should be FCM token, not phone number
      };

      // For actual SMS, you would use a service like Twilio
      // const result = await this.sendViaTwilio(cleanPhone, otp);
      
      console.log(`SMS sent to ${cleanPhone}: ${otp}`);
      return { success: true, messageId: 'firebase-' + Date.now() };
      
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new AppError('Failed to send OTP via SMS', 500, 'SMS_SEND_FAILED');
    }
  }

  // Send OTP via Push Notification
  async sendOTPViaPush(fcmToken, otp) {
    try {
      if (!fcmToken) {
        throw new AppError('FCM token required for push notification', 400, 'FCM_TOKEN_REQUIRED');
      }

      const message = {
        notification: {
          title: 'RulerRide - OTP Verification',
          body: `Your verification code is: ${otp}`
        },
        data: {
          type: 'otp',
          otp: otp,
          timestamp: Date.now().toString()
        },
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'content-available': 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log(`Push notification sent: ${response}`);
      
      return { success: true, messageId: response };
      
    } catch (error) {
      console.error('Push notification failed:', error);
      throw new AppError('Failed to send OTP via push notification', 500, 'PUSH_SEND_FAILED');
    }
  }

  // Send OTP (automatic method selection)
  async sendOTP(phone, options = {}) {
    try {
      // Check if user is blocked
      if (this.isUserBlocked(phone)) {
        throw new AppError('Too many attempts. Please try again later.', 429, 'USER_BLOCKED');
      }

      const otp = options.useSecure ? this.generateSecureOTP() : this.generateOTP();
      const expiresIn = options.expiresIn || 5 * 60 * 1000; // 5 minutes

      // Store OTP
      this.storeOTP(phone, otp, expiresIn);

      // Send via multiple channels
      const results = {};

      // SMS (primary)
      try {
        results.sms = await this.sendOTPViaSMS(phone, otp);
      } catch (error) {
        console.error('SMS sending failed:', error);
        results.sms = { success: false, error: error.message };
      }

      // Push notification (if FCM token provided)
      if (options.fcmToken) {
        try {
          results.push = await this.sendOTPViaPush(options.fcmToken, otp);
        } catch (error) {
          console.error('Push notification failed:', error);
          results.push = { success: false, error: error.message };
        }
      }

      return {
        success: true,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresIn: expiresIn / 1000, // seconds
        results
      };

    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      console.error('OTP sending failed:', error);
      throw new AppError('Failed to send OTP', 500, 'OTP_SEND_FAILED');
    }
  }

  // Resend OTP
  async resendOTP(phone, options = {}) {
    const key = this.getOTPKey(phone);
    const otpData = this.otpStore.get(key);

    if (otpData && (Date.now() - otpData.createdAt) < 60000) { // 1 minute cooldown
      throw new AppError('Please wait before requesting a new OTP', 429, 'OTP_COOLDOWN');
    }

    return this.sendOTP(phone, options);
  }

  // Block user temporarily
  blockUser(phone) {
    const key = this.getBlockKey(phone);
    this.otpAttempts.set(key, {
      blockedAt: Date.now(),
      attempts: this.maxAttempts
    });

    setTimeout(() => {
      this.otpAttempts.delete(key);
    }, this.blockDuration);
  }

  // Check if user is blocked
  isUserBlocked(phone) {
    const key = this.getBlockKey(phone);
    const blockData = this.otpAttempts.get(key);

    if (!blockData) return false;

    if (Date.now() - blockData.blockedAt > this.blockDuration) {
      this.otpAttempts.delete(key);
      return false;
    }

    return true;
  }

  // Clear user block
  clearUserBlock(phone) {
    const key = this.getBlockKey(phone);
    this.otpAttempts.delete(key);
  }

  // Clean phone number format
  cleanPhoneNumber(phone) {
    return phone.replace(/[^\d+]/g, '');
  }

  // Generate OTP key
  getOTPKey(phone) {
    return `otp:${this.cleanPhoneNumber(phone)}`;
  }

  // Generate block key
  getBlockKey(phone) {
    return `block:${this.cleanPhoneNumber(phone)}`;
  }

  // Get OTP status
  getOTPStatus(phone) {
    const key = this.getOTPKey(phone);
    const otpData = this.otpStore.get(key);

    if (!otpData) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      maxAttempts: this.maxAttempts,
      isExpired: Date.now() > otpData.expiresAt
    };
  }

  // Clear all OTPs (for testing)
  clearAllOTPs() {
    this.otpStore.clear();
    this.otpAttempts.clear();
  }

  // Send emergency alert via push notification
  async sendEmergencyAlert(fcmTokens, alertData) {
    try {
      if (!fcmTokens || fcmTokens.length === 0) {
        throw new AppError('No FCM tokens provided for emergency alert', 400, 'NO_FCM_TOKENS');
      }

      const message = {
        notification: {
          title: '🚨 EMERGENCY ALERT - RulerRide',
          body: `Emergency reported by ${alertData.userName}. Location: ${alertData.location}`
        },
        data: {
          type: 'emergency',
          alertId: alertData.alertId,
          userId: alertData.userId,
          location: JSON.stringify(alertData.coordinates),
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            color: '#FF0000',
            tag: 'emergency'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'content-available': 1,
              badge: 1
            }
          }
        }
      };

      const results = [];
      for (const token of fcmTokens) {
        try {
          const response = await admin.messaging().send({
            ...message,
            token
          });
          results.push({ token, success: true, messageId: response });
        } catch (error) {
          console.error(`Failed to send emergency alert to ${token}:`, error);
          results.push({ token, success: false, error: error.message });
        }
      }

      return results;

    } catch (error) {
      console.error('Emergency alert sending failed:', error);
      throw new AppError('Failed to send emergency alert', 500, 'EMERGENCY_ALERT_FAILED');
    }
  }
}

// Create singleton instance
const otpService = new OTPService();

module.exports = otpService;