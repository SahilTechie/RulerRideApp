const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error = {
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors
    };
    return res.status(400).json(error);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error = {
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_FIELD',
      field
    };
    return res.status(400).json(error);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID'
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
    return res.status(401).json(error);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      message: 'File size too large',
      code: 'FILE_TOO_LARGE'
    };
    return res.status(400).json(error);
  }

  // Payment gateway errors
  if (err.name === 'RazorpayError') {
    error = {
      success: false,
      message: 'Payment processing failed',
      code: 'PAYMENT_ERROR',
      details: err.message
    };
    return res.status(400).json(error);
  }

  // Network/External API errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    error = {
      success: false,
      message: 'External service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    };
    return res.status(503).json(error);
  }

  // Rate limiting errors
  if (err.name === 'RateLimitError') {
    error = {
      success: false,
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    };
    return res.status(429).json(error);
  }

  // Custom application errors
  if (err.isOperational) {
    error = {
      success: false,
      message: err.message,
      code: err.code || 'APP_ERROR'
    };
    return res.status(err.statusCode || 400).json(error);
  }

  // Development environment - include stack trace
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err.message;
  }

  // Production environment - generic error message
  if (process.env.NODE_ENV === 'production') {
    error.message = 'Something went wrong. Please try again later.';
  }

  res.status(500).json(error);
};

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    endpoint: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler,
  notFound
};