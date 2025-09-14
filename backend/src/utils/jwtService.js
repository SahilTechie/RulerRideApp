const jwt = require('jsonwebtoken');

class JWTService {
  static generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
      issuer: 'RulerRide',
      audience: 'RulerRide-App'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateAccessToken(user) {
    const payload = {
      userId: user._id,
      phone: user.phone,
      role: user.role,
      type: 'access'
    };

    return this.generateToken(payload, { expiresIn: '1h' });
  }

  static generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      phone: user.phone,
      type: 'refresh'
    };

    return this.generateToken(payload, { expiresIn: '30d' });
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }
}

module.exports = JWTService;