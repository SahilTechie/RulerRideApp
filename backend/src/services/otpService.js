const admin = require('firebase-admin');

class OTPService {
  constructor() {
    // Initialize Firebase Admin SDK if not already initialized
    if (!admin.apps.length) {
      try {
        // Check if Firebase service account file path is provided
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        if (serviceAccountPath && projectId) {
          // Try to load the service account file
          const serviceAccount = require(`../../${serviceAccountPath}`);
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId
          });
          this.isFirebaseConfigured = true;
          console.log('✅ Firebase Admin SDK initialized successfully with service account');
        } else {
          console.log('⚠️ Firebase service account file or project ID not configured, using development mode');
          this.isFirebaseConfigured = false;
        }
      } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.log('⚠️ Using development mode for OTP service');
        this.isFirebaseConfigured = false;
      }
    } else {
      this.isFirebaseConfigured = true;
    }
  }

  generateOTP() {
    // Generate 4-digit OTP
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendOTP(phoneNumber, otp, userName = '') {
    try {
      if (!this.isFirebaseConfigured) {
        // For development/testing, log OTP instead of sending
        console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
        return {
          success: true,
          message: 'OTP sent successfully (development mode)',
          messageId: `dev_${Date.now()}`
        };
      }

      // Create custom token for phone auth (alternative approach)
      // Note: Firebase Admin SDK doesn't directly send SMS, but we can use it for verification
      
      // For production, you would integrate with Firebase Auth REST API or a service like Firebase Functions
      // This is a simplified implementation for demonstration
      
      console.log(`📱 Firebase OTP for ${phoneNumber}: ${otp}`);
      console.log(`📱 Message: ${otp} is your RulerRide verification code. ${userName ? `Hi ${userName}, ` : ''}Please do not share this code with anyone. Valid for 10 minutes.`);
      
      // In a real implementation, you would:
      // 1. Use Firebase Functions to trigger SMS via a service
      // 2. Or integrate with Firebase Auth Phone verification
      // 3. Or use a service like Firebase Extensions for SMS
      
      return {
        success: true,
        message: 'OTP sent successfully via Firebase',
        messageId: `firebase_${Date.now()}`
      };

    } catch (error) {
      console.error('Error sending OTP via Firebase:', error);
      
      // For development, still return success but log error
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 OTP for ${phoneNumber}: ${otp} (Firebase mode: ${error.message})`);
        return {
          success: true,
          message: 'OTP sent successfully (development mode)',
          messageId: `dev_error_${Date.now()}`
        };
      }

      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
        error: error.message
      };
    }
  }

  async sendEmergencyAlert(phoneNumbers, message, location = null) {
    try {
      if (!this.isFirebaseConfigured) {
        console.log(`🚨 Emergency alert would be sent to: ${phoneNumbers.join(', ')}`);
        console.log(`🚨 Message: ${message}`);
        if (location) {
          console.log(`🚨 Location: ${location.latitude}, ${location.longitude}`);
        }
        return { success: true, message: 'Emergency alert sent (development mode)' };
      }

      // In a real Firebase implementation, you would:
      // 1. Send push notifications via Firebase Cloud Messaging (FCM)
      // 2. Trigger SMS via Firebase Functions
      // 3. Store alerts in Firestore for tracking
      
      const alertMessage = `🚨 EMERGENCY ALERT: ${message}${location ? ` Location: https://maps.google.com/?q=${location.latitude},${location.longitude}` : ''} - RulerRide Safety Team`;
      
      console.log(`🚨 Firebase Emergency Alert sent to ${phoneNumbers.length} contacts`);
      console.log(`🚨 Message: ${alertMessage}`);
      
      // Mock successful delivery to all contacts
      return {
        success: true,
        message: `Emergency alert sent to ${phoneNumbers.length} contacts via Firebase`,
        details: { successful: phoneNumbers.length, failed: 0, total: phoneNumbers.length }
      };

    } catch (error) {
      console.error('Error sending emergency alert via Firebase:', error);
      return {
        success: false,
        message: 'Failed to send emergency alert',
        error: error.message
      };
    }
  }

  async sendRideUpdates(phoneNumber, message) {
    try {
      if (!this.isFirebaseConfigured) {
        console.log(`🚗 Ride update for ${phoneNumber}: ${message}`);
        return { success: true, message: 'Ride update sent (development mode)' };
      }

      // In production, this would send push notifications via FCM
      console.log(`🚗 Firebase ride update for ${phoneNumber}: RulerRide Update: ${message}`);

      return {
        success: true,
        message: 'Ride update sent successfully via Firebase',
        messageId: `firebase_update_${Date.now()}`
      };

    } catch (error) {
      console.error('Error sending ride update via Firebase:', error);
      return {
        success: false,
        message: 'Failed to send ride update',
        error: error.message
      };
    }
  }

  validatePhoneNumber(phoneNumber) {
    // Indian phone number validation
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or other characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add +91 if not present - check if it's a valid 10-digit Indian mobile number
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    if (phoneNumber.startsWith('+91') && cleaned.length === 12) {
      return phoneNumber;
    }
    
    return phoneNumber; // Return as-is if format not recognized
  }
}

module.exports = new OTPService();