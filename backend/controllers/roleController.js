const Role = require('../models/Role');
const { createSuccessResponse, createErrorResponse } = require('../utils/response');

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ level: 1 });

    createSuccessResponse(res, 200, roles, 'Roles retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve roles', error.message);
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!role) {
      return createErrorResponse(res, 404, 'Role not found');
    }

    createSuccessResponse(res, 200, role, 'Role retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve role', error.message);
  }
};

// Create new role (admin only)
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const currentUser = req.user;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return createErrorResponse(res, 400, 'Role with this name already exists');
    }

    // Set level based on role name
    const levelMap = { admin: 1, manager: 2, user: 3 };
    const level = levelMap[name] || 3;

    // Create new role
    const role = new Role({
      name,
      description,
      permissions,
      level,
      createdBy: currentUser._id,
      updatedBy: currentUser._id
    });

    await role.save();

    // Populate audit fields
    await role.populate('createdBy', 'name email');
    await role.populate('updatedBy', 'name email');

    createSuccessResponse(res, 201, role, 'Role created successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to create role', error.message);
  }
};

// Update role (admin only)
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const currentUser = req.user;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return createErrorResponse(res, 404, 'Role not found');
    }

    // Cannot update system roles
    if (role.system) {
      return createErrorResponse(res, 400, 'Cannot update system roles');
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return createErrorResponse(res, 400, 'Role name already exists');
      }
    }

    // Update role
    const updateData = {
      updatedBy: currentUser._id
    };

    if (name) {
      updateData.name = name;
      // Update level based on new name
      const levelMap = { admin: 1, manager: 2, user: 3 };
      updateData.level = levelMap[name] || 3;
    }
    if (description) updateData.description = description;
    if (permissions) updateData.permissions = permissions;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    createSuccessResponse(res, 200, updatedRole, 'Role updated successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to update role', error.message);
  }
};

// Delete role (admin only)
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return createErrorResponse(res, 404, 'Role not found');
    }

    // Cannot delete system roles
    if (role.system) {
      return createErrorResponse(res, 400, 'Cannot delete system roles');
    }

    // Check if role is being used by any users
    const User = require('../models/User');
    const usersWithRole = await User.countDocuments({ role: role.name });
    if (usersWithRole > 0) {
      return createErrorResponse(res, 400, 'Cannot delete role that is assigned to users');
    }

    await Role.findByIdAndDelete(id);

    createSuccessResponse(res, 200, null, 'Role deleted successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to delete role', error.message);
  }
};

// Initialize default roles (admin only, for setup)
const initializeRoles = async (req, res) => {
  try {
    await Role.initializeDefaultRoles();
    
    const roles = await Role.find().sort({ level: 1 });
    
    createSuccessResponse(res, 200, roles, 'Default roles initialized successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to initialize roles', error.message);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  initializeRoles
};
