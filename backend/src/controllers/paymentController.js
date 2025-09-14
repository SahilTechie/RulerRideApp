const Payment = require('../models/Payment');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay conditionally
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Razorpay:', error.message);
  }
} else {
  console.warn('Razorpay credentials not found - payment features will be disabled');
}

class PaymentController {
  // Create payment order
  static createPayment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { rideId, paymentMethod = 'online' } = req.body;
    const userId = req.user.id;

    // Find the ride
    const ride = await Ride.findById(rideId)
      .populate('riderId', 'name phone email')
      .populate('driverId', 'name phone');

    if (!ride) {
      throw new AppError('Ride not found', 404, 'RIDE_NOT_FOUND');
    }

    // Check if user is authorized (rider or driver)
    if (ride.riderId._id.toString() !== userId && ride.driverId._id.toString() !== userId) {
      throw new AppError('Unauthorized to process payment for this ride', 403, 'UNAUTHORIZED');
    }

    // Check if ride is completed
    if (ride.status !== 'completed') {
      throw new AppError('Payment can only be processed for completed rides', 400, 'RIDE_NOT_COMPLETED');
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ rideId });
    if (existingPayment && existingPayment.status === 'completed') {
      throw new AppError('Payment already completed for this ride', 400, 'PAYMENT_ALREADY_COMPLETED');
    }

    const amount = ride.actualFare || ride.estimatedFare;
    const receiptId = `ride_${rideId}_${Date.now()}`;

    let paymentData = {
      rideId: ride._id,
      riderId: ride.riderId._id,
      driverId: ride.driverId._id,
      amount: amount,
      currency: 'INR',
      paymentMethod,
      status: 'pending',
      receiptId,
      fareBreakdown: {
        baseFare: calculateBaseFare(ride.vehicleType),
        distanceFare: calculateDistanceFare(ride.actualDistance || ride.estimatedDistance, ride.vehicleType),
        totalFare: amount,
        taxes: Math.round(amount * 0.05), // 5% tax
        driverCommission: Math.round(amount * 0.2), // 20% commission
        platformFee: Math.round(amount * 0.05) // 5% platform fee
      }
    };

    if (paymentMethod === 'online') {
      if (!razorpay) {
        throw new AppError('Payment gateway not available - check Razorpay configuration', 503, 'PAYMENT_GATEWAY_UNAVAILABLE');
      }

      try {
        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          receipt: receiptId,
          payment_capture: 1,
          notes: {
            rideId: rideId,
            riderId: ride.riderId._id.toString(),
            driverId: ride.driverId._id.toString()
          }
        });

        paymentData.gatewayOrderId = razorpayOrder.id;
        paymentData.gatewayDetails = {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        };

      } catch (error) {
        console.error('Razorpay order creation failed:', error);
        throw new AppError('Failed to create payment order', 500, 'PAYMENT_GATEWAY_ERROR');
      }
    }

    // Create payment record
    const payment = new Payment(paymentData);
    await payment.save();

    // Update ride with payment reference
    await Ride.findByIdAndUpdate(rideId, {
      paymentId: payment._id,
      paymentStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        paymentId: payment._id,
        rideId: rideId,
        amount: amount,
        currency: paymentData.currency,
        paymentMethod: paymentMethod,
        gatewayOrderId: paymentData.gatewayOrderId,
        gatewayDetails: paymentData.gatewayDetails,
        fareBreakdown: paymentData.fareBreakdown
      }
    });
  });

  // Verify payment
  static verifyPayment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // Find the payment
    const payment = await Payment.findById(paymentId)
      .populate('rideId')
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone');

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Check authorization
    if (payment.riderId._id.toString() !== userId && payment.driverId._id.toString() !== userId) {
      throw new AppError('Unauthorized to verify this payment', 403, 'UNAUTHORIZED');
    }

    if (payment.paymentMethod === 'online') {
      // Verify Razorpay signature
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        // Update payment status to failed
        await Payment.findByIdAndUpdate(paymentId, {
          status: 'failed',
          failureReason: 'Invalid signature',
          processedAt: new Date()
        });

        throw new AppError('Payment verification failed', 400, 'PAYMENT_VERIFICATION_FAILED');
      }

      // Payment verified successfully
      const updateData = {
        status: 'completed',
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature,
        processedAt: new Date(),
        gatewayResponse: {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          signature: razorpay_signature
        }
      };

      await Payment.findByIdAndUpdate(paymentId, updateData);
    } else {
      // Cash payment confirmation
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'completed',
        processedAt: new Date()
      });
    }

    // Update ride payment status
    await Ride.findByIdAndUpdate(payment.rideId._id, {
      paymentStatus: 'completed'
    });

    // Process driver payout
    await processDriverPayout(payment);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment._id,
        rideId: payment.rideId._id,
        status: 'completed',
        amount: payment.amount,
        processedAt: new Date()
      }
    });
  });

  // Get payment details
  static getPaymentDetails = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId)
      .populate('rideId')
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone');

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Check authorization
    if (payment.riderId._id.toString() !== userId && payment.driverId._id.toString() !== userId) {
      throw new AppError('Unauthorized to view this payment', 403, 'UNAUTHORIZED');
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });
  });

  // Get payment history
  static getPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, paymentMethod } = req.query;

    const query = {
      $or: [{ riderId: userId }, { driverId: userId }]
    };

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(query)
      .populate('rideId', 'pickupLocation destination vehicleType')
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  });

  // Process refund
  static processRefund = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId)
      .populate('rideId')
      .populate('riderId', 'name phone');

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Check authorization (only rider can request refund)
    if (payment.riderId._id.toString() !== userId) {
      throw new AppError('Unauthorized to request refund for this payment', 403, 'UNAUTHORIZED');
    }

    if (payment.status !== 'completed') {
      throw new AppError('Cannot refund incomplete payment', 400, 'PAYMENT_NOT_COMPLETED');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new AppError('Refund amount cannot exceed payment amount', 400, 'INVALID_REFUND_AMOUNT');
    }

    let refundData = {
      refundAmount,
      refundReason: reason,
      refundStatus: 'pending',
      refundRequestedAt: new Date()
    };

    if (payment.paymentMethod === 'online' && payment.gatewayPaymentId) {
      if (!razorpay) {
        // Manual refund processing when gateway is not available
        refundData.refundStatus = 'manual_processing';
        refundData.refundFailureReason = 'Payment gateway not available - manual processing required';
      } else {
        try {
          // Process refund through Razorpay
          const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
            amount: refundAmount * 100, // Convert to paise
            notes: {
              reason: reason,
              rideId: payment.rideId._id.toString()
            }
          });

          refundData.gatewayRefundId = refund.id;
          refundData.refundStatus = 'completed';
          refundData.refundProcessedAt = new Date();
          refundData.gatewayRefundDetails = refund;

        } catch (error) {
          console.error('Razorpay refund failed:', error);
          refundData.refundStatus = 'failed';
          refundData.refundFailureReason = error.message;
        }
      }
    } else {
      // Cash refund - mark as pending for manual processing
      refundData.refundStatus = 'pending_manual_processing';
    }

    // Update payment with refund details
    await Payment.findByIdAndUpdate(paymentId, refundData);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        paymentId: payment._id,
        refundAmount,
        refundStatus: refundData.refundStatus,
        gatewayRefundId: refundData.gatewayRefundId
      }
    });
  });

  // Get payment analytics (for drivers)
  static getPaymentAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== 'driver') {
      throw new AppError('Only drivers can access payment analytics', 403, 'UNAUTHORIZED');
    }

    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const analytics = await Payment.aggregate([
      {
        $match: {
          driverId: userId,
          status: 'completed',
          processedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$fareBreakdown.driverCommission' },
          totalRides: { $sum: 1 },
          averageEarning: { $avg: '$fareBreakdown.driverCommission' },
          totalFareCollected: { $sum: '$amount' }
        }
      }
    ]);

    const dailyEarnings = await Payment.aggregate([
      {
        $match: {
          driverId: userId,
          status: 'completed',
          processedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$processedAt' } },
          earnings: { $sum: '$fareBreakdown.driverCommission' },
          rides: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: `${period} days`,
        analytics: analytics[0] || {
          totalEarnings: 0,
          totalRides: 0,
          averageEarning: 0,
          totalFareCollected: 0
        },
        dailyEarnings
      }
    });
  });
}

// Helper functions
function calculateBaseFare(vehicleType) {
  const baseFares = {
    'auto': 25,
    'cab': 40,
    'bike': 15
  };
  return baseFares[vehicleType] || baseFares['auto'];
}

function calculateDistanceFare(distance, vehicleType) {
  const perKmRates = {
    'auto': 12,
    'cab': 18,
    'bike': 8
  };
  const rate = perKmRates[vehicleType] || perKmRates['auto'];
  return Math.round(distance * rate);
}

async function processDriverPayout(payment) {
  try {
    // Calculate driver payout
    const driverEarning = payment.fareBreakdown.driverCommission;
    
    // Update driver's earnings
    await User.findByIdAndUpdate(payment.driverId, {
      $inc: {
        'driverProfile.totalEarnings': driverEarning,
        'driverProfile.totalRides': 1
      }
    });

    console.log(`💰 Driver payout processed: ₹${driverEarning} for driver ${payment.driverId}`);
    
    // In production, integrate with bank transfer APIs
    // For now, just log the payout
    
  } catch (error) {
    console.error('Driver payout processing failed:', error);
  }
}

module.exports = PaymentController;