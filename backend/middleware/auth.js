const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createErrorResponse } = require('../utils/response');

// 🔐 Authenticate Token (FIXED)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(res, 401, 'Access token is required');
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return createErrorResponse(res, 401, 'Invalid token - user not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      return createErrorResponse(res, 401, 'Account is inactive');
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return createErrorResponse(res, 401, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      return createErrorResponse(res, 401, 'Token expired');
    } else {
      return createErrorResponse(res, 500, 'Authentication error');
    }
  }
};



// 🛡️ Role-based authorization
const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return createErrorResponse(res, 401, 'Authentication required');
    }

    // Admin has full access
    if (req.user.role === 'admin') {
      return next();
    }

    for (const permission of permissions) {
      const [resource, action] = permission.split(':');

      switch (req.user.role) {
        case 'manager':
          if (resource === 'users' && !['read', 'update'].includes(action)) {
            return createErrorResponse(res, 403, 'Insufficient permissions');
          }
          break;

        case 'user':
          if (resource === 'users' && action !== 'read') {
            return createErrorResponse(res, 403, 'Insufficient permissions');
          }
          break;

        default:
          return createErrorResponse(res, 403, 'Insufficient permissions');
      }
    }

    next();
  };
};



// 👤 Allow only owner (or admin)
const authorizeOwner = (req, res, next) => {
  if (!req.user) {
    return createErrorResponse(res, 401, 'Authentication required');
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  const targetUserId = req.params.id || req.params.userId;

  if (targetUserId !== req.user._id.toString()) {
    return createErrorResponse(res, 403, 'Access denied');
  }

  next();
};



// 👑 Allow specific roles
const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return createErrorResponse(res, 401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return createErrorResponse(res, 403, 'Insufficient role permissions');
    }

    next();
  };
};



// 🔄 Role hierarchy check
const checkRoleHierarchy = (req, res, next) => {
  if (!req.user) {
    return createErrorResponse(res, 401, 'Authentication required');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'manager') {
    const targetRole = req.body.role;
    if (targetRole === 'admin' || targetRole === 'manager') {
      return createErrorResponse(res, 403, 'Cannot assign higher roles');
    }
    return next();
  }

  return createErrorResponse(res, 403, 'Cannot modify roles');
};



module.exports = {
  authenticateToken,
  authorize,
  authorizeOwner,
  authorizeRole,
  checkRoleHierarchy
};