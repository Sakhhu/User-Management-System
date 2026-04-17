const AuditLog = require('../models/AuditLog');

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    try {
      // Don't audit health checks and other system endpoints
      if (req.path === '/health' || req.path.startsWith('/api/health')) {
        return next();
      }

      // Get user info from request (set by auth middleware)
      const user = req.user;
      
      // Skip audit for non-authenticated requests unless it's a login attempt
      if (!user && action !== 'LOGIN') {
        return next();
      }

      // Extract IP address and user agent
      const ipAddress = req.ip || req.connection.remoteAddress || 
                       req.headers['x-forwarded-for'] || 
                       req.headers['x-real-ip'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Prepare audit log data
      const auditData = {
        action,
        resource,
        userId: user?._id || null,
        userEmail: user?.email || req.body?.email || 'anonymous',
        userRole: user?.role || 'anonymous',
        resourceId: req.params?.id || null,
        ipAddress,
        userAgent,
        success: res.statusCode < 400,
        details: {
          method: req.method,
          path: req.path,
          body: sanitizeRequestBody(req.body),
          params: req.params,
          query: req.query,
          statusCode: res.statusCode
        }
      };

      // For login failures, capture the error
      if (action === 'LOGIN' && res.statusCode >= 400) {
        auditData.success = false;
        auditData.errorMessage = res.locals.errorMessage || 'Login failed';
      }

      // Create audit log entry (don't wait for it to complete)
      AuditLog.createLog(auditData).catch(err => {
        console.error('Audit logging failed:', err);
      });

      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next(); // Don't break the request flow
    }
  };
};

// Helper function to sanitize request body for logging
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields from logs
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'refreshToken'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Specific audit middleware for different actions
const auditLogin = auditMiddleware('LOGIN', 'auth');
const auditLogout = auditMiddleware('LOGOUT', 'auth');
const auditLogoutAll = auditMiddleware('LOGOUT_ALL', 'auth');
const auditCreateUser = auditMiddleware('CREATE_USER', 'user');
const auditUpdateUser = auditMiddleware('UPDATE_USER', 'user');
const auditDeleteUser = auditMiddleware('DELETE_USER', 'user');
const auditActivateUser = auditMiddleware('ACTIVATE_USER', 'user');
const auditChangePassword = auditMiddleware('CHANGE_PASSWORD', 'auth');
const auditUpdateProfile = auditMiddleware('UPDATE_PROFILE', 'profile');
const auditCreateRole = auditMiddleware('CREATE_ROLE', 'role');
const auditUpdateRole = auditMiddleware('UPDATE_ROLE', 'role');
const auditDeleteRole = auditMiddleware('DELETE_ROLE', 'role');

module.exports = {
  auditMiddleware,
  auditLogin,
  auditLogout,
  auditLogoutAll,
  auditCreateUser,
  auditUpdateUser,
  auditDeleteUser,
  auditActivateUser,
  auditChangePassword,
  auditUpdateProfile,
  auditCreateRole,
  auditUpdateRole,
  auditDeleteRole
};
