const JWTService = require('../utils/jwtService');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401, 'TOKEN_REQUIRED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = JWTService.verifyToken(token);
    
    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (user.status === 'suspended') {
      throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    // Add user to request object
    req.user = {
      id: user._id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Handle custom AppError
    if (error.isOperational) {
      return res.status(error.statusCode || 401).json({
        success: false,
        message: error.message,
        code: error.code || 'AUTH_ERROR'
      });
    }

    // Handle unexpected errors
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

// Middleware to check if user has specific role
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user is verified
const verifiedUserMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }

  next();
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth
    }

    const token = authHeader.substring(7);
    const decoded = JWTService.verifyToken(token);
    
    if (decoded.type === 'access') {
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status !== 'suspended') {
        req.user = {
          id: user._id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified
        };
      }
    }

    next();

  } catch (error) {
    // Ignore auth errors for optional middleware
    next();
  }
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  verifiedUserMiddleware,
  optionalAuthMiddleware
};

// Export default as authMiddleware for convenience
module.exports.default = authMiddleware;
module.exports = authMiddleware;