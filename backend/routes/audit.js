const express = require('express');
const router = express.Router();

// Import controllers and middleware
const auditController = require('../controllers/auditController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateMongoId, validatePagination } = require('../middleware/validation');

// Get user activity logs
router.get('/users/:userId',
  authenticateToken,
  validateMongoId('userId'),
  validatePagination,
  auditController.getUserActivity
);

// Get system activity logs (admin only)
router.get('/system',
  authenticateToken,
  authorizeRole(['admin']),
  validatePagination,
  auditController.getSystemActivity
);

// Get activity statistics (admin only)
router.get('/statistics',
  authenticateToken,
  authorizeRole(['admin']),
  auditController.getActivityStatistics
);

// Get recent failed logins (admin only)
router.get('/failed-logins',
  authenticateToken,
  authorizeRole(['admin']),
  auditController.getRecentFailedLogins
);

module.exports = router;
