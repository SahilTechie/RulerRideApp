const admin = require('firebase-admin');
const { AppError } = require('../middleware/errorHandler');

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Send push notification to single user
  async sendToUser(fcmToken, notification, data = {}) {
    try {
      if (!fcmToken) {
        throw new AppError('FCM token is required', 400, 'FCM_TOKEN_REQUIRED');
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/assets/images/icon.png',
          badge: notification.badge || '/assets/images/icon.png'
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
          notificationId: this.generateNotificationId()
        },
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: notification.sound || 'default',
            priority: 'high',
            color: notification.color || '#2196F3',
            clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              'content-available': 1,
              badge: notification.badge || 1
            }
          },
          headers: {
            'apns-priority': '10'
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Notification sent successfully: ${response}`);
      
      return {
        success: true,
        messageId: response,
        token: fcmToken
      };

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      
      if (error.code === 'messaging/registration-token-not-registered') {
        return {
          success: false,
          error: 'TOKEN_INVALID',
          message: 'FCM token is invalid or not registered'
        };
      }

      return {
        success: false,
        error: error.code || 'UNKNOWN_ERROR',
        message: error.message
      };
    }
  }

  // Send notification to multiple users
  async sendToMultipleUsers(fcmTokens, notification, data = {}) {
    if (!fcmTokens || fcmTokens.length === 0) {
      throw new AppError('At least one FCM token is required', 400, 'NO_FCM_TOKENS');
    }

    const results = [];
    const batchSize = 500; // Firebase limit

    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);
      const batchResults = await this.sendBatch(batch, notification, data);
      results.push(...batchResults);
    }

    return results;
  }

  // Send notification batch
  async sendBatch(tokens, notification, data = {}) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/assets/images/icon.png'
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
          notificationId: this.generateNotificationId()
        },
        tokens: tokens,
        android: {
          priority: 'high',
          notification: {
            sound: notification.sound || 'default',
            priority: 'high',
            color: notification.color || '#2196F3'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              'content-available': 1,
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      
      const results = response.responses.map((resp, index) => ({
        token: tokens[index],
        success: resp.success,
        messageId: resp.messageId,
        error: resp.error ? resp.error.code : null
      }));

      console.log(`📊 Batch notification results: ${response.successCount}/${tokens.length} successful`);
      
      return results;

    } catch (error) {
      console.error('❌ Batch notification failed:', error);
      throw new AppError('Failed to send batch notifications', 500, 'BATCH_NOTIFICATION_FAILED');
    }
  }

  // Send ride-related notifications
  async sendRideNotification(userToken, type, rideData) {
    const notifications = {
      'ride_requested': {
        title: '🚗 Ride Requested',
        body: `Your ride from ${rideData.pickup} to ${rideData.destination} has been requested.`,
        sound: 'default'
      },
      'driver_assigned': {
        title: '👨‍✈️ Driver Assigned',
        body: `${rideData.driverName} is coming to pick you up. ETA: ${rideData.eta} mins`,
        sound: 'default'
      },
      'driver_arrived': {
        title: '📍 Driver Arrived',
        body: `${rideData.driverName} has arrived at your pickup location.`,
        sound: 'notification.mp3'
      },
      'ride_started': {
        title: '🚀 Ride Started',
        body: `Your ride has started. Enjoy your journey!`,
        sound: 'default'
      },
      'ride_completed': {
        title: '✅ Ride Completed',
        body: `You have arrived at your destination. Fare: ₹${rideData.fare}`,
        sound: 'default'
      },
      'ride_cancelled': {
        title: '❌ Ride Cancelled',
        body: `Your ride has been cancelled. ${rideData.reason || ''}`,
        sound: 'default'
      },
      'payment_completed': {
        title: '💳 Payment Successful',
        body: `Payment of ₹${rideData.amount} completed successfully.`,
        sound: 'default'
      }
    };

    const notification = notifications[type];
    if (!notification) {
      throw new AppError(`Unknown notification type: ${type}`, 400, 'UNKNOWN_NOTIFICATION_TYPE');
    }

    const data = {
      type: 'ride',
      subType: type,
      rideId: rideData.rideId || '',
      driverId: rideData.driverId || '',
      clickAction: 'RIDE_DETAILS'
    };

    return this.sendToUser(userToken, notification, data);
  }

  // Send driver notifications
  async sendDriverNotification(driverToken, type, rideData) {
    const notifications = {
      'new_ride_request': {
        title: '🔔 New Ride Request',
        body: `New ride request from ${rideData.pickup} to ${rideData.destination}. Fare: ₹${rideData.fare}`,
        sound: 'notification.mp3',
        color: '#4CAF50'
      },
      'ride_accepted': {
        title: '✅ Ride Accepted',
        body: `You accepted the ride. Navigate to pickup location.`,
        sound: 'default'
      },
      'ride_cancelled_by_user': {
        title: '❌ Ride Cancelled',
        body: `The rider cancelled the trip. Cancellation fee may apply.`,
        sound: 'default'
      },
      'payment_received': {
        title: '💰 Payment Received',
        body: `You received ₹${rideData.amount} for the completed ride.`,
        sound: 'cash.mp3'
      }
    };

    const notification = notifications[type];
    if (!notification) {
      throw new AppError(`Unknown driver notification type: ${type}`, 400, 'UNKNOWN_NOTIFICATION_TYPE');
    }

    const data = {
      type: 'driver',
      subType: type,
      rideId: rideData.rideId || '',
      userId: rideData.userId || '',
      clickAction: 'DRIVER_DASHBOARD'
    };

    return this.sendToUser(driverToken, notification, data);
  }

  // Send emergency notifications
  async sendEmergencyNotification(tokens, alertData) {
    const notification = {
      title: '🚨 EMERGENCY ALERT',
      body: `Emergency reported by ${alertData.userName}. Location: ${alertData.location}`,
      sound: 'emergency.mp3',
      color: '#FF0000'
    };

    const data = {
      type: 'emergency',
      alertId: alertData.alertId,
      userId: alertData.userId,
      coordinates: JSON.stringify(alertData.coordinates),
      clickAction: 'EMERGENCY_DETAILS'
    };

    if (Array.isArray(tokens)) {
      return this.sendToMultipleUsers(tokens, notification, data);
    } else {
      return this.sendToUser(tokens, notification, data);
    }
  }

  // Send promotional notifications
  async sendPromoNotification(tokens, promoData) {
    const notification = {
      title: '🎉 Special Offer!',
      body: promoData.message,
      icon: promoData.icon || '/assets/images/promo.png',
      sound: 'default'
    };

    const data = {
      type: 'promo',
      promoCode: promoData.code || '',
      discount: promoData.discount || '',
      clickAction: 'PROMO_DETAILS'
    };

    if (Array.isArray(tokens)) {
      return this.sendToMultipleUsers(tokens, notification, data);
    } else {
      return this.sendToUser(tokens, notification, data);
    }
  }

  // Send system notifications
  async sendSystemNotification(tokens, message, data = {}) {
    const notification = {
      title: 'RulerRide System',
      body: message,
      sound: 'default'
    };

    const notificationData = {
      type: 'system',
      ...data,
      clickAction: 'MAIN_SCREEN'
    };

    if (Array.isArray(tokens)) {
      return this.sendToMultipleUsers(tokens, notification, notificationData);
    } else {
      return this.sendToUser(tokens, notification, notificationData);
    }
  }

  // Schedule notification for later
  scheduleNotification(delay, fcmToken, notification, data = {}) {
    setTimeout(async () => {
      try {
        await this.sendToUser(fcmToken, notification, data);
        console.log(`⏰ Scheduled notification sent after ${delay}ms`);
      } catch (error) {
        console.error('❌ Scheduled notification failed:', error);
      }
    }, delay);
  }

  // Retry failed notification
  async retryNotification(fcmToken, notification, data = {}, attempt = 1) {
    try {
      const result = await this.sendToUser(fcmToken, notification, data);
      if (result.success) {
        return result;
      }

      if (attempt < this.retryAttempts) {
        console.log(`🔄 Retrying notification... Attempt ${attempt + 1}`);
        await this.delay(this.retryDelay);
        return this.retryNotification(fcmToken, notification, data, attempt + 1);
      } else {
        throw new AppError('Max retry attempts reached', 500, 'MAX_RETRIES_REACHED');
      }
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`🔄 Retrying notification after error... Attempt ${attempt + 1}`);
        await this.delay(this.retryDelay);
        return this.retryNotification(fcmToken, notification, data, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  // Subscribe to topic
  async subscribeToTopic(tokens, topic) {
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`📢 Subscribed ${response.successCount} users to topic: ${topic}`);
      return response;
    } catch (error) {
      console.error('❌ Topic subscription failed:', error);
      throw new AppError('Failed to subscribe to topic', 500, 'TOPIC_SUBSCRIPTION_FAILED');
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(tokens, topic) {
    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`📢 Unsubscribed ${response.successCount} users from topic: ${topic}`);
      return response;
    } catch (error) {
      console.error('❌ Topic unsubscription failed:', error);
      throw new AppError('Failed to unsubscribe from topic', 500, 'TOPIC_UNSUBSCRIPTION_FAILED');
    }
  }

  // Send to topic
  async sendToTopic(topic, notification, data = {}) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...data,
          timestamp: Date.now().toString()
        },
        topic: topic
      };

      const response = await admin.messaging().send(message);
      console.log(`📢 Topic notification sent: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('❌ Topic notification failed:', error);
      throw new AppError('Failed to send topic notification', 500, 'TOPIC_NOTIFICATION_FAILED');
    }
  }

  // Generate unique notification ID
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate FCM token format
  isValidFCMToken(token) {
    if (!token || typeof token !== 'string') return false;
    // Basic validation for FCM token format
    return token.length > 100 && /^[A-Za-z0-9_-]+$/.test(token.replace(/:/g, ''));
  }

  // Clean and validate FCM tokens
  cleanFCMTokens(tokens) {
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }
    
    return tokens.filter(token => this.isValidFCMToken(token));
  }

  // Get notification statistics
  getStats() {
    return {
      queueLength: this.notificationQueue.length,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;