const express = require('express');
const { body } = require('express-validator');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const createPaymentValidation = [
  body('rideId').isMongoId().withMessage('Valid ride ID required'),
  body('paymentMethod').isIn(['online', 'cash']).withMessage('Valid payment method required')
];

const verifyPaymentValidation = [
  body('paymentId').isMongoId().withMessage('Valid payment ID required'),
  body('razorpay_payment_id').optional().isString().withMessage('Valid Razorpay payment ID required'),
  body('razorpay_order_id').optional().isString().withMessage('Valid Razorpay order ID required'),
  body('razorpay_signature').optional().isString().withMessage('Valid Razorpay signature required')
];

const refundValidation = [
  body('reason').notEmpty().withMessage('Refund reason is required'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Valid refund amount required')
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Payment processing routes
router.post('/create', createPaymentValidation, PaymentController.createPayment);
router.post('/verify', verifyPaymentValidation, PaymentController.verifyPayment);
router.post('/:paymentId/refund', refundValidation, PaymentController.processRefund);

// Payment information routes
router.get('/:paymentId', PaymentController.getPaymentDetails);
router.get('/history/list', PaymentController.getPaymentHistory);
router.get('/analytics/earnings', PaymentController.getPaymentAnalytics);

// Health check for payment service
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payment service operational',
    features: [
      'Razorpay Integration',
      'Payment Processing',
      'Refund Handling',
      'Driver Payouts',
      'Payment Analytics'
    ]
  });
});

module.exports = router;