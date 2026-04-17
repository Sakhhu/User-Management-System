const express = require('express');
const router = express.Router();

// Import controllers and middleware
const userController = require('../controllers/userController');
const { authenticateToken, authorize, authorizeOwner, authorizeRole, checkRoleHierarchy } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserUpdate,
  validateMongoId,
  validatePagination
} = require('../middleware/validation');

// Routes for all authenticated users
router.get('/me', authenticateToken, userController.getUserById);
router.put('/me', authenticateToken, validateUserUpdate, userController.updateUser);

// Admin/Manager routes
router.get('/', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  validatePagination, 
  userController.getAllUsers
);

router.get('/statistics', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  userController.getUserStatistics
);

// Admin only routes
router.post('/', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateUserRegistration, 
  userController.createUser
);

router.get('/:id', 
  authenticateToken, 
  validateMongoId('id'), 
  authorizeOwner, 
  userController.getUserById
);

router.put('/:id', 
  authenticateToken, 
  validateMongoId('id'), 
  authorizeOwner, 
  validateUserUpdate, 
  userController.updateUser
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateMongoId('id'), 
  userController.deleteUser
);

router.put('/:id/activate', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateMongoId('id'), 
  userController.activateUser
);

router.put('/:id/reset-password', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateMongoId('id'), 
  userController.resetPassword
);

module.exports = router;
