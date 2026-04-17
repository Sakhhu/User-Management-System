const express = require('express');
const router = express.Router();

// Import controllers and middleware
const roleController = require('../controllers/roleController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  validateRoleCreation,
  validateMongoId
} = require('../middleware/validation');

// Admin only routes
router.get('/', 
  authenticateToken, 
  authorizeRole(['admin']), 
  roleController.getAllRoles
);

router.post('/initialize', 
  authenticateToken, 
  authorizeRole(['admin']), 
  roleController.initializeRoles
);

router.get('/:id', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateMongoId('id'), 
  roleController.getRoleById
);

router.post('/', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateRoleCreation, 
  roleController.createRole
);

router.put('/:id', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateMongoId('id'), 
  roleController.updateRole
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validateMongoId('id'), 
  roleController.deleteRole
);

module.exports = router;
