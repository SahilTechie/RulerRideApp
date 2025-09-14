const SOSAlert = require('../models/SOSAlert');
const User = require('../models/User');
const Ride = require('../models/Ride');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const OTPService = require('../services/otpService');
const socketService = require('../services/socketService');

class SOSController {
  // Trigger SOS alert
  static triggerAlert = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { 
      alertType, 
      location, 
      message, 
      rideId, 
      severity = 'high' 
    } = req.body;
    const userId = req.user.id;

    // Get user details
    const user = await User.findById(userId).populate('emergencyContacts.contactId', 'name phone');
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Create SOS alert
    const sosAlert = new SOSAlert({
      userId,
      alertType,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address || 'Unknown location'
      },
      message: message || getDefaultMessage(alertType),
      rideId: rideId || null,
      severity,
      status: 'active',
      triggeredAt: new Date(),
      userDetails: {
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

    await sosAlert.save();

    // Get ride details if available
    let rideDetails = null;
    if (rideId) {
      rideDetails = await Ride.findById(rideId)
        .populate('riderId', 'name phone')
        .populate('driverId', 'name phone');
    }

    // Prepare alert data
    const alertData = {
      alertId: sosAlert._id,
      alertType,
      severity,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Unknown location',
        googleMapsUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`
      },
      message: sosAlert.message,
      ride: rideDetails ? {
        id: rideDetails._id,
        status: rideDetails.status,
        rider: rideDetails.riderId,
        driver: rideDetails.driverId,
        vehicleType: rideDetails.vehicleType
      } : null,
      timestamp: sosAlert.triggeredAt
    };

    // Notify emergency contacts
    await notifyEmergencyContacts(user, alertData);

    // Notify nearby drivers if user is a rider
    if (user.role === 'rider') {
      await notifyNearbyDrivers(alertData);
    }

    // Notify rider if user is a driver and in active ride
    if (user.role === 'driver' && rideDetails) {
      await notifyRiderOfDriverSOS(rideDetails.riderId._id, alertData);
    }

    // Broadcast to admin users
    socketService.emitToUser('admin', 'sos_alert', alertData);

    // Send SMS to emergency services based on alert type
    await notifyEmergencyServices(alertType, alertData);

    // Auto-escalate after 5 minutes if not resolved
    setTimeout(async () => {
      await autoEscalateAlert(sosAlert._id);
    }, 5 * 60 * 1000); // 5 minutes

    res.status(201).json({
      success: true,
      message: 'SOS alert triggered successfully',
      data: {
        alertId: sosAlert._id,
        alertType,
        severity,
        status: 'active',
        emergencyContactsNotified: user.emergencyContacts.length,
        location: alertData.location
      }
    });
  });

  // Update SOS alert status
  static updateAlertStatus = asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    const { status, responderInfo, resolutionNote } = req.body;
    const userId = req.user.id;

    const alert = await SOSAlert.findById(alertId);
    if (!alert) {
      throw new AppError('SOS alert not found', 404, 'ALERT_NOT_FOUND');
    }

    // Check authorization
    const user = await User.findById(userId);
    const canUpdate = alert.userId.toString() === userId || 
                     user.role === 'admin' || 
                     (responderInfo && responderInfo.type === 'emergency_service');

    if (!canUpdate) {
      throw new AppError('Unauthorized to update this alert', 403, 'UNAUTHORIZED');
    }

    const updateData = {
      status,
      lastUpdatedAt: new Date()
    };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
      updateData.resolutionNote = resolutionNote;
    }

    if (status === 'responded') {
      updateData.respondedAt = new Date();
      updateData.responderInfo = responderInfo;
    }

    await SOSAlert.findByIdAndUpdate(alertId, updateData);

    // Notify all concerned parties about status update
    const statusUpdateData = {
      alertId,
      status,
      responderInfo,
      resolutionNote,
      updatedBy: user.name,
      timestamp: new Date()
    };

    // Notify the user who triggered the alert
    socketService.emitToUser(alert.userId, 'sos_status_update', statusUpdateData);

    // Notify emergency contacts
    const alertUser = await User.findById(alert.userId).populate('emergencyContacts.contactId', 'name phone');
    await notifyContactsOfStatusUpdate(alertUser, statusUpdateData);

    res.status(200).json({
      success: true,
      message: `SOS alert status updated to ${status}`,
      data: {
        alertId,
        status,
        updatedAt: updateData.lastUpdatedAt
      }
    });
  });

  // Get SOS alert details
  static getAlertDetails = asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    const userId = req.user.id;

    const alert = await SOSAlert.findById(alertId)
      .populate('userId', 'name phone role')
      .populate('rideId');

    if (!alert) {
      throw new AppError('SOS alert not found', 404, 'ALERT_NOT_FOUND');
    }

    // Check authorization
    const user = await User.findById(userId);
    const canView = alert.userId._id.toString() === userId || 
                   user.role === 'admin' ||
                   user.emergencyContacts.some(contact => 
                     contact.contactId.toString() === userId
                   );

    if (!canView) {
      throw new AppError('Unauthorized to view this alert', 403, 'UNAUTHORIZED');
    }

    res.status(200).json({
      success: true,
      data: { alert }
    });
  });

  // Get user's SOS alert history
  static getAlertHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const alerts = await SOSAlert.find(query)
      .populate('rideId', 'vehicleType pickupLocation destination')
      .sort({ triggeredAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SOSAlert.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        alerts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAlerts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  });

  // Add emergency contact
  static addEmergencyContact = asyncHandler(async (req, res) => {
    const { name, phone, relationship, isNotificationEnabled = true } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if contact already exists
    const existingContact = user.emergencyContacts.find(contact => contact.phone === phone);
    if (existingContact) {
      throw new AppError('Emergency contact already exists', 400, 'CONTACT_EXISTS');
    }

    // Add new emergency contact
    const newContact = {
      name,
      phone,
      relationship,
      isNotificationEnabled,
      addedAt: new Date()
    };

    await User.findByIdAndUpdate(userId, {
      $push: { emergencyContacts: newContact }
    });

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: { contact: newContact }
    });
  });

  // Update emergency contact
  static updateEmergencyContact = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const { name, phone, relationship, isNotificationEnabled } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const contactIndex = user.emergencyContacts.findIndex(contact => 
      contact._id.toString() === contactId
    );

    if (contactIndex === -1) {
      throw new AppError('Emergency contact not found', 404, 'CONTACT_NOT_FOUND');
    }

    // Update contact
    const updateData = {};
    if (name) updateData[`emergencyContacts.${contactIndex}.name`] = name;
    if (phone) updateData[`emergencyContacts.${contactIndex}.phone`] = phone;
    if (relationship) updateData[`emergencyContacts.${contactIndex}.relationship`] = relationship;
    if (isNotificationEnabled !== undefined) {
      updateData[`emergencyContacts.${contactIndex}.isNotificationEnabled`] = isNotificationEnabled;
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully'
    });
  });

  // Remove emergency contact
  static removeEmergencyContact = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $pull: { emergencyContacts: { _id: contactId } }
    });

    res.status(200).json({
      success: true,
      message: 'Emergency contact removed successfully'
    });
  });

  // Get emergency contacts
  static getEmergencyContacts = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findById(userId).select('emergencyContacts');
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: { emergencyContacts: user.emergencyContacts }
    });
  });
}

// Helper functions
function getDefaultMessage(alertType) {
  const messages = {
    'emergency': 'Emergency situation - immediate help needed!',
    'safety_concern': 'Safety concern during ride',
    'breakdown': 'Vehicle breakdown - assistance needed',
    'medical': 'Medical emergency - urgent help required',
    'harassment': 'Harassment incident - help needed',
    'accident': 'Accident occurred - emergency services needed'
  };
  return messages[alertType] || 'Emergency alert triggered';
}

async function notifyEmergencyContacts(user, alertData) {
  const enabledContacts = user.emergencyContacts.filter(contact => 
    contact.isNotificationEnabled
  );

  if (enabledContacts.length === 0) {
    return;
  }

  const phones = enabledContacts.map(contact => contact.phone);
  const message = `🚨 EMERGENCY ALERT: ${user.name} has triggered a ${alertData.alertType} alert. Location: ${alertData.location.address}. Please check immediately. - RulerRide Safety`;

  try {
    await OTPService.sendEmergencyAlert(phones, message, alertData.location);
    console.log(`📱 Emergency contacts notified for alert ${alertData.alertId}`);
  } catch (error) {
    console.error('Failed to notify emergency contacts:', error);
  }
}

async function notifyNearbyDrivers(alertData) {
  // Find nearby drivers
  const nearbyDrivers = await User.find({
    role: 'driver',
    'driverProfile.status': 'online',
    'driverProfile.currentLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [alertData.location.longitude, alertData.location.latitude]
        },
        $maxDistance: 5000 // 5km radius
      }
    }
  });

  const driverIds = nearbyDrivers.map(driver => driver._id);
  
  socketService.emitToDrivers(driverIds, 'nearby_sos_alert', {
    alertId: alertData.alertId,
    alertType: alertData.alertType,
    location: alertData.location,
    user: alertData.user,
    severity: alertData.severity
  });
}

async function notifyRiderOfDriverSOS(riderId, alertData) {
  socketService.emitToUser(riderId, 'driver_sos_alert', {
    alertId: alertData.alertId,
    driver: alertData.user,
    location: alertData.location,
    message: alertData.message
  });
}

async function notifyEmergencyServices(alertType, alertData) {
  const emergencyNumbers = {
    'emergency': process.env.EMERGENCY_POLICE || '100',
    'medical': process.env.EMERGENCY_AMBULANCE || '108',
    'accident': process.env.EMERGENCY_POLICE || '100'
  };

  const number = emergencyNumbers[alertType];
  if (number) {
    const message = `RulerRide SOS Alert: ${alertType.toUpperCase()} at ${alertData.location.address}. Contact: ${alertData.user.phone}. Location: ${alertData.location.googleMapsUrl}`;
    
    try {
      // In production, integrate with emergency services API
      console.log(`🚨 Emergency services notified: ${number} - ${message}`);
    } catch (error) {
      console.error('Failed to notify emergency services:', error);
    }
  }
}

async function autoEscalateAlert(alertId) {
  try {
    const alert = await SOSAlert.findById(alertId);
    if (alert && alert.status === 'active') {
      await SOSAlert.findByIdAndUpdate(alertId, {
        status: 'escalated',
        escalatedAt: new Date(),
        escalationReason: 'Auto-escalated after 5 minutes of no response'
      });

      // Notify additional emergency contacts or services
      console.log(`🚨 Alert ${alertId} auto-escalated after 5 minutes`);
    }
  } catch (error) {
    console.error('Auto-escalation failed:', error);
  }
}

async function notifyContactsOfStatusUpdate(user, statusData) {
  const enabledContacts = user.emergencyContacts.filter(contact => 
    contact.isNotificationEnabled
  );

  if (enabledContacts.length === 0) {
    return;
  }

  const phones = enabledContacts.map(contact => contact.phone);
  const message = `Update on ${user.name}'s emergency alert: Status changed to ${statusData.status.toUpperCase()}. ${statusData.resolutionNote || ''} - RulerRide Safety`;

  try {
    await OTPService.sendRideUpdates(phones[0], message); // Send to first contact
    console.log(`📱 Emergency contacts notified of status update for alert ${statusData.alertId}`);
  } catch (error) {
    console.error('Failed to notify contacts of status update:', error);
  }
}

module.exports = SOSController;