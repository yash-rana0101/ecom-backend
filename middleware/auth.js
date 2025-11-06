import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
        req.user = await User.findById(decoded.id);
      } catch (err) {
        // Token invalid, continue as guest
        req.user = null;
      }
    }

    // Set userId for cart/checkout operations
    req.headers['user-id'] = req.user ? req.user._id.toString() : 'guest-user';
    next();
  } catch (error) {
    next();
  }
};
