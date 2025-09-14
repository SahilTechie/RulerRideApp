const express = require('express');
const { body, param } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authMiddleware, requireVerification, rateLimitByUser } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const phoneValidation = body('phoneNumber')
  .notEmpty()
  .withMessage('Phone number is required')
  .isMobilePhone('en-IN')
  .withMessage('Invalid phone number format');

const otpValidation = body('otp')
  .notEmpty()
  .withMessage('OTP is required')
  .isLength({ min: 4, max: 6 })
  .withMessage('OTP must be 4-6 digits')
  .isNumeric()
  .withMessage('OTP must contain only numbers');

const nameValidation = body('name')
  .optional()
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Name must be between 2-50 characters')
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('Name can only contain letters and spaces');

const emergencyContactValidation = [
  body('name')
    .notEmpty()
    .withMessage('Contact name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Contact phone is required')
    .isMobilePhone('en-IN')
    .withMessage('Invalid phone number format'),
  body('relationship')
    .notEmpty()
    .withMessage('Relationship is required')
    .isIn(['parent', 'spouse', 'sibling', 'friend', 'colleague', 'other'])
    .withMessage('Invalid relationship type')
];

const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
  body('preferences.language')
    .optional()
    .isIn(['en', 'hi'])
    .withMessage('Invalid language preference'),
  body('preferences.paymentMethod')
    .optional()
    .isIn(['cash', 'upi', 'wallet'])
    .withMessage('Invalid payment method')
];

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', 
  rateLimitByUser(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  phoneValidation,
  AuthController.sendOTP
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and login/register user
 * @access  Public
 */
router.post('/verify-otp',
  rateLimitByUser(3, 15 * 60 * 1000), // 3 requests per 15 minutes
  [phoneValidation, otpValidation, nameValidation],
  AuthController.verifyOTP
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', AuthController.refreshToken);

/**
 * @route   GET /api/auth/check-phone/:phoneNumber
 * @desc    Check if phone number is registered
 * @access  Public
 */
router.get('/check-phone/:phoneNumber',
  param('phoneNumber').isMobilePhone('en-IN').withMessage('Invalid phone number format'),
  AuthController.checkPhone
);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authMiddleware, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authMiddleware,
  requireVerification,
  profileUpdateValidation,
  AuthController.updateProfile
);

/**
 * @route   POST /api/auth/emergency-contact
 * @desc    Add emergency contact
 * @access  Private
 */
router.post('/emergency-contact',
  authMiddleware,
  requireVerification,
  emergencyContactValidation,
  AuthController.addEmergencyContact
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear refresh token)
 * @access  Private
 */
router.post('/logout', authMiddleware, AuthController.logout);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account',
  authMiddleware,
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason too long'),
  AuthController.deleteAccount
);

module.exports = router;