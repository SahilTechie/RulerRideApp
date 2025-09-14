const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  // Ride Identification
  rideId: {
    type: String,
    unique: true,
    required: true
  },

  // Parties Involved
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Location Information
  pickup: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    landmark: String,
    instructions: String
  },

  destination: {
    address: {
      type: String,
      required: [true, 'Destination address is required']
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    landmark: String,
    instructions: String
  },

  // Ride Details
  vehicleType: {
    type: String,
    enum: ['bike', 'auto'],
    required: true
  },
  
  distance: {
    type: Number, // in kilometers
    required: true
  },

  // Fare Information
  fareDetails: {
    baseFare: { type: Number, required: true },
    distanceFare: { type: Number, required: true },
    timeFare: { type: Number, default: 0 },
    tollCharges: { type: Number, default: 0 },
    surgeMultiplier: { type: Number, default: 1 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },

  // Ride Status and Timing
  status: {
    type: String,
    enum: [
      'requested',        // Ride requested by rider
      'searching_driver', // Looking for available driver
      'driver_assigned',  // Driver assigned and heading to pickup
      'driver_arrived',   // Driver reached pickup location
      'ride_started',     // Ride in progress
      'ride_completed',   // Ride finished successfully
      'cancelled_by_rider', // Cancelled by rider
      'cancelled_by_driver', // Cancelled by driver
      'cancelled_by_system' // Cancelled due to timeout/issues
    ],
    default: 'requested'
  },

  timestamps: {
    requestedAt: { type: Date, default: Date.now },
    driverAssignedAt: Date,
    driverArrivedAt: Date,
    rideStartedAt: Date,
    rideCompletedAt: Date,
    cancelledAt: Date
  },

  // Estimated times (in minutes)
  estimatedTimes: {
    driverArrival: Number, // ETA for driver to reach pickup
    rideDuration: Number,  // Estimated ride duration
    totalTime: Number      // Total estimated time
  },

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'upi', 'wallet', 'card'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },

  // Rating and Feedback
  rating: {
    riderToDriver: {
      stars: { type: Number, min: 1, max: 5 },
      comment: String,
      timestamp: Date
    },
    driverToRider: {
      stars: { type: Number, min: 1, max: 5 },
      comment: String,
      timestamp: Date
    }
  },

  // Route and Tracking
  route: {
    actualPath: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }],
    totalDistance: Number, // Actual distance traveled
    totalTime: Number      // Actual time taken
  },

  // Cancellation Information
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    charges: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 }
  },

  // Special Requirements
  specialRequests: {
    type: [String],
    enum: ['wheelchair_accessible', 'pet_friendly', 'extra_luggage', 'silent_ride', 'ac_preferred']
  },

  // Emergency and Safety
  sosAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOSAlert'
  }],

  isEmergencyRide: { type: Boolean, default: false },

  // Driver Assignment History
  assignmentHistory: [{
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    response: {
      type: String,
      enum: ['accepted', 'rejected', 'timeout']
    },
    responseTime: Number // Time taken to respond in seconds
  }],

  // Promotional and Referral
  promoCode: String,
  referralCode: String,
  
  // Metadata
  appVersion: String,
  platform: String,
  deviceInfo: {
    os: String,
    version: String,
    model: String
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
rideSchema.index({ rideId: 1 });
rideSchema.index({ rider: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ 'timestamps.requestedAt': -1 });
rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

// Virtual fields
rideSchema.virtual('duration').get(function() {
  if (this.timestamps.rideCompletedAt && this.timestamps.rideStartedAt) {
    return Math.round((this.timestamps.rideCompletedAt - this.timestamps.rideStartedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

rideSchema.virtual('waitingTime').get(function() {
  if (this.timestamps.rideStartedAt && this.timestamps.driverArrivedAt) {
    return Math.round((this.timestamps.rideStartedAt - this.timestamps.driverArrivedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Instance methods
rideSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  const now = new Date();
  this.status = newStatus;
  
  switch (newStatus) {
    case 'driver_assigned':
      this.timestamps.driverAssignedAt = now;
      break;
    case 'driver_arrived':
      this.timestamps.driverArrivedAt = now;
      break;
    case 'ride_started':
      this.timestamps.rideStartedAt = now;
      break;
    case 'ride_completed':
      this.timestamps.rideCompletedAt = now;
      break;
    case 'cancelled_by_rider':
    case 'cancelled_by_driver':
    case 'cancelled_by_system':
      this.timestamps.cancelledAt = now;
      if (additionalData.reason) {
        this.cancellation.reason = additionalData.reason;
      }
      if (additionalData.cancelledBy) {
        this.cancellation.cancelledBy = additionalData.cancelledBy;
      }
      break;
  }
  
  this.updatedAt = now;
};

rideSchema.methods.calculateFare = function() {
  const { baseFare, distanceFare, timeFare = 0, tollCharges = 0, surgeMultiplier = 1, discount = 0 } = this.fareDetails;
  
  const subtotal = (baseFare + distanceFare + timeFare + tollCharges) * surgeMultiplier;
  const total = Math.max(0, subtotal - discount);
  
  this.fareDetails.total = Math.round(total * 100) / 100; // Round to 2 decimal places
  return this.fareDetails.total;
};

rideSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['requested', 'searching_driver', 'driver_assigned', 'driver_arrived'];
  return cancellableStatuses.includes(this.status);
};

rideSchema.methods.addSOSAlert = function(sosAlertId) {
  if (!this.sosAlerts.includes(sosAlertId)) {
    this.sosAlerts.push(sosAlertId);
  }
};

// Static methods
rideSchema.statics.generateRideId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `RR${timestamp}${random}`.toUpperCase();
};

rideSchema.statics.getActiveRides = function() {
  return this.find({
    status: { $in: ['driver_assigned', 'driver_arrived', 'ride_started'] }
  }).populate('rider driver', 'name phone');
};

rideSchema.statics.getRidesByStatus = function(status) {
  return this.find({ status }).populate('rider driver', 'name phone');
};

// Pre-save middleware
rideSchema.pre('save', function(next) {
  // Generate ride ID if not present
  if (!this.rideId) {
    this.rideId = this.constructor.generateRideId();
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('Ride', rideSchema);