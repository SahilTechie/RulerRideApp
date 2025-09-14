const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+91[0-9]{10}$/, 'Please enter a valid Indian phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Authentication
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  lastOTP: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },

  // Profile Information
  avatar: {
    type: String, // URL to profile image
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  
  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      required: true
    },
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    city: String,
    state: String,
    pincode: String,
    isDefault: { type: Boolean, default: false }
  }],

  // Emergency Contacts
  emergencyContacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  }],

  // Preferences
  preferences: {
    language: { type: String, default: 'en', enum: ['en', 'hi'] },
    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'wallet'],
      default: 'cash'
    }
  },

  // Ride History and Statistics
  rideStats: {
    totalRides: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    cancelledRides: { type: Number, default: 0 }
  },

  // Driver-specific fields (only for drivers)
  driverInfo: {
    licenseNumber: String,
    licenseExpiry: Date,
    vehicleType: { type: String, enum: ['bike', 'auto'] },
    vehicleNumber: String,
    vehicleModel: String,
    vehicleYear: Number,
    documents: {
      license: String, // URL to license image
      registration: String, // URL to vehicle registration
      insurance: String, // URL to insurance document
      photo: String // URL to driver photo
    },
    isOnline: { type: Boolean, default: false },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    },
    earnings: {
      today: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },

  // Security and Activity
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    device: String,
    location: String
  }],
  
  // Timestamps
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'driverInfo.isOnline': 1 });
userSchema.index({ 'driverInfo.currentLocation': '2dsphere' });

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  return this.name || this.phone;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = function() {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  this.lastOTP = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0
  };
  return otp;
};

userSchema.methods.verifyOTP = function(otp) {
  if (!this.lastOTP || !this.lastOTP.code) return false;
  if (this.lastOTP.expiresAt < new Date()) return false;
  if (this.lastOTP.attempts >= 3) return false;
  
  if (this.lastOTP.code === otp) {
    this.lastOTP = undefined;
    this.isVerified = true;
    return true;
  } else {
    this.lastOTP.attempts += 1;
    return false;
  }
};

userSchema.methods.updateRideStats = function(rideData) {
  this.rideStats.totalRides += 1;
  this.rideStats.totalSpent += rideData.fare || 0;
  
  if (rideData.rating) {
    const totalRating = (this.rideStats.averageRating * this.rideStats.totalRatings) + rideData.rating;
    this.rideStats.totalRatings += 1;
    this.rideStats.averageRating = totalRating / this.rideStats.totalRatings;
  }
};

userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.lastOTP;
  delete userObject.loginHistory;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);