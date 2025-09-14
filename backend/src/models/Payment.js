const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment Identification
  paymentId: {
    type: String,
    unique: true,
    required: true
  },

  // Associated Ride and User
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Payment Details
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },

  // Payment Method
  method: {
    type: String,
    enum: ['cash', 'upi', 'wallet', 'card', 'netbanking'],
    required: true
  },

  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refund'],
    default: 'pending'
  },

  // Gateway Information
  gateway: {
    provider: {
      type: String,
      enum: ['razorpay', 'phonepe', 'paytm', 'gpay', 'cash'],
      required: true
    },
    transactionId: String,
    orderId: String,
    paymentId: String,
    signature: String,
    response: mongoose.Schema.Types.Mixed
  },

  // UPI Details (for UPI payments)
  upiDetails: {
    vpa: String, // Virtual Payment Address
    transactionRef: String,
    payerName: String,
    payerVPA: String
  },

  // Card Details (masked for security)
  cardDetails: {
    last4Digits: String,
    cardType: { type: String, enum: ['credit', 'debit'] },
    network: { type: String, enum: ['visa', 'mastercard', 'rupay', 'amex'] },
    bank: String
  },

  // Wallet Details
  walletDetails: {
    provider: String,
    walletId: String,
    balance: Number
  },

  // Fare Breakdown
  fareBreakdown: {
    baseFare: { type: Number, required: true },
    distanceFare: { type: Number, required: true },
    timeFare: { type: Number, default: 0 },
    tollCharges: { type: Number, default: 0 },
    surgeCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    promoDiscount: { type: Number, default: 0 },
    referralDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true }
  },

  // Promotional Codes
  promoCode: {
    code: String,
    discountAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 }
  },

  // Refund Information
  refund: {
    amount: { type: Number, default: 0 },
    reason: String,
    status: {
      type: String,
      enum: ['none', 'initiated', 'processing', 'completed', 'failed'],
      default: 'none'
    },
    refundId: String,
    processedAt: Date,
    refundMethod: String
  },

  // Tips and Additional Charges
  tip: {
    amount: { type: Number, default: 0 },
    method: String
  },

  // Timestamps
  timestamps: {
    initiatedAt: { type: Date, default: Date.now },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    refundedAt: Date
  },

  // Payment Attempts
  attempts: [{
    attemptNumber: Number,
    timestamp: { type: Date, default: Date.now },
    status: String,
    errorCode: String,
    errorMessage: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  }],

  // Security and Fraud Prevention
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  fraudFlags: [{
    flag: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    timestamp: { type: Date, default: Date.now }
  }],

  // Split Payment (for driver commission)
  splitPayment: {
    driverAmount: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    commissionPercent: { type: Number, default: 0 }
  },

  // Metadata
  metadata: {
    deviceInfo: {
      platform: String,
      version: String,
      ipAddress: String
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    userAgent: String
  },

  // Notes and Comments
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: { type: Date, default: Date.now }
  }],

  // Audit Trail
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ ride: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ 'gateway.provider': 1 });
paymentSchema.index({ 'gateway.transactionId': 1 });
paymentSchema.index({ 'timestamps.initiatedAt': -1 });

// Virtual fields
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

paymentSchema.virtual('isFailed').get(function() {
  return ['failed', 'cancelled'].includes(this.status);
});

paymentSchema.virtual('isPending').get(function() {
  return ['pending', 'processing'].includes(this.status);
});

paymentSchema.virtual('totalRefunded').get(function() {
  return this.refund.amount || 0;
});

// Instance methods
paymentSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  const now = new Date();
  this.status = newStatus;
  
  switch (newStatus) {
    case 'processing':
      this.timestamps.processedAt = now;
      break;
    case 'completed':
      this.timestamps.completedAt = now;
      break;
    case 'failed':
      this.timestamps.failedAt = now;
      break;
    case 'refunded':
      this.timestamps.refundedAt = now;
      break;
  }
  
  if (additionalData.gatewayResponse) {
    this.gateway.response = additionalData.gatewayResponse;
  }
  
  this.updatedAt = now;
};

paymentSchema.methods.addAttempt = function(status, errorCode = null, errorMessage = null, gatewayResponse = null) {
  const attemptNumber = this.attempts.length + 1;
  
  this.attempts.push({
    attemptNumber,
    timestamp: new Date(),
    status,
    errorCode,
    errorMessage,
    gatewayResponse
  });
};

paymentSchema.methods.initiateRefund = function(amount, reason) {
  this.refund = {
    amount,
    reason,
    status: 'initiated',
    refundMethod: this.method
  };
  
  if (amount >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partial_refund';
  }
};

paymentSchema.methods.calculateCommission = function(commissionPercent = 10) {
  const platformCommission = Math.round((this.amount * commissionPercent) / 100);
  const driverAmount = this.amount - platformCommission;
  
  this.splitPayment = {
    driverAmount,
    platformCommission,
    commissionPercent
  };
  
  return this.splitPayment;
};

paymentSchema.methods.addNote = function(text, addedBy) {
  this.notes.push({
    text,
    addedBy,
    timestamp: new Date()
  });
};

// Static methods
paymentSchema.statics.generatePaymentId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PAY${timestamp}${random}`.toUpperCase();
};

paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'timestamps.completedAt': {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        totalCommission: { $sum: '$splitPayment.platformCommission' }
      }
    }
  ]);
};

paymentSchema.statics.getMethodStats = function() {
  return this.aggregate([
    {
      $match: { status: 'completed' }
    },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Generate payment ID if not present
  if (!this.paymentId) {
    this.paymentId = this.constructor.generatePaymentId();
  }
  
  // Calculate split payment if not already calculated
  if (!this.splitPayment.driverAmount && this.status === 'completed') {
    this.calculateCommission();
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);