const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  // Alert Identification
  alertId: {
    type: String,
    unique: true,
    required: true
  },

  // Associated Entities
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    default: null // Can be null for general emergencies
  },

  // Alert Type and Severity
  alertType: {
    type: String,
    enum: [
      'emergency',        // General emergency
      'medical',         // Medical emergency
      'accident',        // Vehicle accident
      'harassment',      // Harassment/safety concern
      'vehicle_breakdown', // Vehicle breakdown
      'route_deviation',  // Driver going off route
      'suspicious_activity', // Suspicious behavior
      'panic_button',    // Panic button pressed
      'auto_triggered'   // Automatically triggered by system
    ],
    required: true
  },

  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },

  // Status and Resolution
  status: {
    type: String,
    enum: [
      'active',          // Alert is active and needs attention
      'acknowledged',    // Emergency services notified
      'responding',      // Help is on the way
      'resolved',        // Emergency resolved
      'false_alarm',     // False alarm/accidental trigger
      'cancelled'        // Cancelled by user
    ],
    default: 'active'
  },

  // Location Information
  location: {
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: String,
    landmark: String,
    accuracy: Number, // GPS accuracy in meters
    timestamp: { type: Date, default: Date.now }
  },

  // User Information at Time of Alert
  userInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }]
  },

  // Ride Information (if applicable)
  rideInfo: {
    rideId: String,
    driverName: String,
    driverPhone: String,
    vehicleNumber: String,
    vehicleType: String,
    pickupAddress: String,
    destinationAddress: String
  },

  // Alert Details
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  userMessage: {
    type: String,
    maxlength: [200, 'User message cannot exceed 200 characters']
  },

  // Media Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'audio', 'video'],
      required: true
    },
    url: { type: String, required: true },
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Response and Actions Taken
  responses: [{
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responseType: {
      type: String,
      enum: ['admin', 'emergency_services', 'police', 'medical', 'support_team']
    },
    action: String,
    notes: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Notifications Sent
  notifications: {
    emergencyContacts: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      recipients: [String] // Phone numbers
    },
    emergencyServices: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      serviceType: String, // police, medical, fire
      referenceNumber: String
    },
    admin: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      adminUsers: [String]
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      count: { type: Number, default: 0 }
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      count: { type: Number, default: 0 }
    }
  },

  // Automatic Triggers
  autoTriggers: {
    speedLimit: {
      triggered: { type: Boolean, default: false },
      maxSpeed: Number,
      currentSpeed: Number
    },
    routeDeviation: {
      triggered: { type: Boolean, default: false },
      deviationDistance: Number // meters
    },
    inactivity: {
      triggered: { type: Boolean, default: false },
      inactivityDuration: Number // minutes
    },
    hardBraking: {
      triggered: { type: Boolean, default: false },
      gForce: Number
    }
  },

  // Resolution Information
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionType: {
      type: String,
      enum: ['user_safe', 'help_arrived', 'false_alarm', 'resolved_by_user', 'police_intervention', 'medical_assistance']
    },
    resolutionNotes: String,
    resolvedAt: Date
  },

  // Follow-up Actions
  followUp: {
    required: { type: Boolean, default: false },
    scheduledAt: Date,
    completedAt: Date,
    notes: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // System Metadata
  metadata: {
    deviceInfo: {
      platform: String,
      version: String,
      batteryLevel: Number,
      networkType: String
    },
    appVersion: String,
    triggerMethod: {
      type: String,
      enum: ['manual', 'automatic', 'voice_command', 'shake_gesture']
    },
    ipAddress: String
  },

  // Priority and Escalation
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 8
  },
  
  escalationLevel: {
    type: Number,
    default: 0
  },
  
  escalationHistory: [{
    level: Number,
    escalatedAt: Date,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],

  // Timestamps
  timestamps: {
    triggeredAt: { type: Date, default: Date.now },
    acknowledgedAt: Date,
    respondedAt: Date,
    resolvedAt: Date
  },

  // Audit Trail
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
sosAlertSchema.index({ alertId: 1 });
sosAlertSchema.index({ user: 1 });
sosAlertSchema.index({ ride: 1 });
sosAlertSchema.index({ status: 1 });
sosAlertSchema.index({ alertType: 1 });
sosAlertSchema.index({ severity: 1 });
sosAlertSchema.index({ 'timestamps.triggeredAt': -1 });
sosAlertSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual fields
sosAlertSchema.virtual('isActive').get(function() {
  return ['active', 'acknowledged', 'responding'].includes(this.status);
});

sosAlertSchema.virtual('responseTime').get(function() {
  if (this.timestamps.respondedAt && this.timestamps.triggeredAt) {
    return Math.round((this.timestamps.respondedAt - this.timestamps.triggeredAt) / (1000 * 60)); // in minutes
  }
  return null;
});

sosAlertSchema.virtual('resolutionTime').get(function() {
  if (this.timestamps.resolvedAt && this.timestamps.triggeredAt) {
    return Math.round((this.timestamps.resolvedAt - this.timestamps.triggeredAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Instance methods
sosAlertSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  const now = new Date();
  this.status = newStatus;
  
  switch (newStatus) {
    case 'acknowledged':
      this.timestamps.acknowledgedAt = now;
      break;
    case 'responding':
      this.timestamps.respondedAt = now;
      break;
    case 'resolved':
    case 'false_alarm':
    case 'cancelled':
      this.timestamps.resolvedAt = now;
      if (additionalData.resolvedBy) {
        this.resolution.resolvedBy = additionalData.resolvedBy;
      }
      if (additionalData.resolutionType) {
        this.resolution.resolutionType = additionalData.resolutionType;
      }
      if (additionalData.resolutionNotes) {
        this.resolution.resolutionNotes = additionalData.resolutionNotes;
      }
      break;
  }
  
  this.updatedAt = now;
};

sosAlertSchema.methods.addResponse = function(respondedBy, responseType, action, notes = '') {
  this.responses.push({
    respondedBy,
    responseType,
    action,
    notes,
    timestamp: new Date()
  });
};

sosAlertSchema.methods.escalate = function(escalatedBy, reason) {
  this.escalationLevel += 1;
  this.escalationHistory.push({
    level: this.escalationLevel,
    escalatedAt: new Date(),
    escalatedBy,
    reason
  });
  
  // Increase priority based on escalation
  this.priority = Math.min(10, this.priority + 1);
};

sosAlertSchema.methods.markNotificationSent = function(type, additionalData = {}) {
  const now = new Date();
  
  switch (type) {
    case 'emergencyContacts':
      this.notifications.emergencyContacts.sent = true;
      this.notifications.emergencyContacts.sentAt = now;
      if (additionalData.recipients) {
        this.notifications.emergencyContacts.recipients = additionalData.recipients;
      }
      break;
    case 'emergencyServices':
      this.notifications.emergencyServices.sent = true;
      this.notifications.emergencyServices.sentAt = now;
      if (additionalData.serviceType) {
        this.notifications.emergencyServices.serviceType = additionalData.serviceType;
      }
      if (additionalData.referenceNumber) {
        this.notifications.emergencyServices.referenceNumber = additionalData.referenceNumber;
      }
      break;
    case 'admin':
      this.notifications.admin.sent = true;
      this.notifications.admin.sentAt = now;
      if (additionalData.adminUsers) {
        this.notifications.admin.adminUsers = additionalData.adminUsers;
      }
      break;
    case 'sms':
      this.notifications.sms.sent = true;
      this.notifications.sms.sentAt = now;
      this.notifications.sms.count += 1;
      break;
    case 'push':
      this.notifications.push.sent = true;
      this.notifications.push.sentAt = now;
      this.notifications.push.count += 1;
      break;
  }
};

sosAlertSchema.methods.shouldAutoEscalate = function() {
  const now = new Date();
  const triggerTime = this.timestamps.triggeredAt;
  const minutesSinceTrigger = (now - triggerTime) / (1000 * 60);
  
  // Auto-escalate after 5 minutes if not acknowledged
  if (this.status === 'active' && minutesSinceTrigger > 5) {
    return true;
  }
  
  // Auto-escalate after 15 minutes if not responding
  if (this.status === 'acknowledged' && minutesSinceTrigger > 15) {
    return true;
  }
  
  return false;
};

// Static methods
sosAlertSchema.statics.generateAlertId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `SOS${timestamp}${random}`.toUpperCase();
};

sosAlertSchema.statics.getActiveAlerts = function() {
  return this.find({
    status: { $in: ['active', 'acknowledged', 'responding'] }
  }).populate('user ride', 'name phone rideId');
};

sosAlertSchema.statics.getAlertsNeedingEscalation = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  return this.find({
    $or: [
      {
        status: 'active',
        'timestamps.triggeredAt': { $lt: fiveMinutesAgo }
      },
      {
        status: 'acknowledged',
        'timestamps.triggeredAt': { $lt: fifteenMinutesAgo }
      }
    ]
  });
};

sosAlertSchema.statics.getAlertStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'timestamps.triggeredAt': {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          alertType: '$alertType',
          status: '$status'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        avgResolutionTime: { $avg: '$resolutionTime' }
      }
    }
  ]);
};

// Pre-save middleware
sosAlertSchema.pre('save', function(next) {
  // Generate alert ID if not present
  if (!this.alertId) {
    this.alertId = this.constructor.generateAlertId();
  }
  
  // Set priority based on alert type and severity
  if (!this.priority || this.priority === 8) {
    const priorityMap = {
      'critical': 10,
      'high': 8,
      'medium': 5,
      'low': 3
    };
    this.priority = priorityMap[this.severity] || 8;
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('SOSAlert', sosAlertSchema);