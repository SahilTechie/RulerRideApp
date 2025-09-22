const User = require('../models/User');
const JWTService = require('../utils/jwtService');
const OTPService = require('../services/otpService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');

class AuthController {
  // Send OTP to phone number
  static sendOTP = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { phoneNumber } = req.body;

    // Format and validate phone number
    const formattedPhone = OTPService.formatPhoneNumber(phoneNumber);
    if (!OTPService.validatePhoneNumber(formattedPhone)) {
      throw new AppError('Invalid phone number format', 400, 'INVALID_PHONE');
    }

    // Check if user exists
    let user = await User.findOne({ phone: formattedPhone });
    
    // Create user if doesn't exist (for first-time users)
    if (!user) {
      user = new User({
        phone: formattedPhone,
        name: 'New User', // Temporary name, will be updated during profile completion
        role: 'rider',
        status: 'pending_verification'
      });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      throw new AppError('Account suspended. Contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Check OTP rate limiting (max 3 attempts per 15 minutes)
    if (user.lastOTP && user.lastOTP.attempts >= 3) {
      const timeSinceLastAttempt = Date.now() - new Date(user.lastOTP.expiresAt).getTime();
      const remainingTime = Math.max(0, (15 * 60 * 1000) - timeSinceLastAttempt);
      
      if (remainingTime > 0) {
        throw new AppError(
          `Too many OTP attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes`,
          429,
          'OTP_RATE_LIMIT'
        );
      }
    }

    // Generate and save OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via SMS
    const otpResult = await OTPService.sendOTP(formattedPhone, otp, user.name);
    
    if (!otpResult.success) {
      throw new AppError('Failed to send OTP. Please try again.', 500, 'OTP_SEND_FAILED');
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phoneNumber: formattedPhone,
        expiresIn: 600, // 10 minutes
        messageId: otpResult.messageId
      }
    });
  });

  // Verify OTP and login/register user
  static verifyOTP = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { phoneNumber, otp, name } = req.body;

    // Format phone number
    const formattedPhone = OTPService.formatPhoneNumber(phoneNumber);

    // Find user
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify OTP
    const isOTPValid = user.verifyOTP(otp);
    if (!isOTPValid) {
      await user.save(); // Save to update attempt count
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Update user details if this is first-time verification
    if (!user.isVerified || !user.name) {
      user.name = name || user.name;
      user.status = 'active';
      user.isVerified = true;
    }

    // Update last active time
    user.lastActive = new Date();
    await user.save();

    // Generate tokens
    const accessToken = JWTService.generateAccessToken(user);
    const refreshToken = JWTService.generateRefreshToken(user);

    // Log login history
    user.loginHistory.push({
      timestamp: new Date(),
      ipAddress: req.ip,
      device: req.get('User-Agent') || 'Unknown',
      location: 'Unknown' // Could be enhanced with IP geolocation
    });

    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }

    await user.save();

    // Set refresh token as HTTP-only cookie for web
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      message: user.isVerified ? 'Login successful' : 'Registration completed',
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken, // Include refresh token for mobile apps
        tokenType: 'Bearer',
        expiresIn: 3600 // 1 hour
      }
    });
  });

  // Refresh access token
  static refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not provided', 401, 'NO_REFRESH_TOKEN');
    }

    try {
      const decoded = JWTService.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
      }

      const newAccessToken = JWTService.generateAccessToken(user);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          tokenType: 'Bearer',
          expiresIn: 3600
        }
      });

    } catch (error) {
      if (error.message === 'Invalid or expired token') {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  });

  // Logout user
  static logout = asyncHandler(async (req, res) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user.toSafeObject()
      }
    });
  });

  // Update user profile
  static updateProfile = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const allowedUpdates = ['name', 'email', 'dateOfBirth', 'gender', 'preferences'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update user
    Object.assign(req.user, updates);
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user.toSafeObject()
      }
    });
  });

  // Add emergency contact
  static addEmergencyContact = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { name, phone, relationship } = req.body;

    // Format phone number
    const formattedPhone = OTPService.formatPhoneNumber(phone);
    if (!OTPService.validatePhoneNumber(formattedPhone)) {
      throw new AppError('Invalid phone number format', 400, 'INVALID_PHONE');
    }

    // Check if contact already exists
    const existingContact = req.user.emergencyContacts.find(
      contact => contact.phone === formattedPhone
    );

    if (existingContact) {
      throw new AppError('Emergency contact already exists', 400, 'CONTACT_EXISTS');
    }

    // Limit to 5 emergency contacts
    if (req.user.emergencyContacts.length >= 5) {
      throw new AppError('Maximum 5 emergency contacts allowed', 400, 'MAX_CONTACTS_REACHED');
    }

    req.user.emergencyContacts.push({
      name,
      phone: formattedPhone,
      relationship
    });

    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        emergencyContacts: req.user.emergencyContacts
      }
    });
  });

  // Check phone number availability
  static checkPhone = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;
    
    const formattedPhone = OTPService.formatPhoneNumber(phoneNumber);
    if (!OTPService.validatePhoneNumber(formattedPhone)) {
      throw new AppError('Invalid phone number format', 400, 'INVALID_PHONE');
    }

    const user = await User.findOne({ phone: formattedPhone });

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: formattedPhone,
        exists: !!user,
        isVerified: user ? user.isVerified : false,
        status: user ? user.status : null
      }
    });
  });

  // Delete user account
  static deleteAccount = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    // Check if user has active rides
    const Ride = require('../models/Ride');
    const activeRides = await Ride.find({
      $or: [
        { rider: req.user._id },
        { driver: req.user._id }
      ],
      status: { $in: ['driver_assigned', 'driver_arrived', 'ride_started'] }
    });

    if (activeRides.length > 0) {
      throw new AppError('Cannot delete account with active rides', 400, 'ACTIVE_RIDES_EXIST');
    }

    // Soft delete - mark as inactive instead of hard delete
    req.user.status = 'inactive';
    req.user.email = req.user.email ? `deleted_${Date.now()}_${req.user.email}` : undefined;
    req.user.phone = `deleted_${Date.now()}_${req.user.phone}`;
    
    // Add deletion reason to notes if provided
    if (reason) {
      req.user.notes = req.user.notes || [];
      req.user.notes.push({
        text: `Account deletion reason: ${reason}`,
        timestamp: new Date()
      });
    }

    await req.user.save();

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  });
}

module.exports = AuthController;