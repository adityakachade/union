const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user inactive.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Middleware to check user roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or has admin/manager role
 */
const authorizeOwnerOrManager = async (req, res, next) => {
  try {
    const { Lead } = require('../models');
    const leadId = req.params.id || req.params.leadId;

    if (!leadId) {
      return next();
    }

    const lead = await Lead.findByPk(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.'
      });
    }

    // Admin and Manager can access all leads
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return next();
    }

    // Sales Executive can only access their own leads
    if (lead.ownerId === req.user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own leads.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization error.'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrManager
};

