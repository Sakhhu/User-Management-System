const User = require('../models/User');
const { createSuccessResponse, createErrorResponse, createPaginatedResponse } = require('../utils/response');

// Get all users (admin/manager only)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role;
    const status = req.query.status;

    // Build filters
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;

    // Get users with pagination and search
    const users = await User.searchUsers(search, page, limit, filters);
    const total = await User.countDocuments({
      status: 'active',
      ...filters,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      })
    });

    createPaginatedResponse(res, 200, users, {
      page,
      limit,
      total
    }, 'Users retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve users', error.message);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Users can only view their own profile unless they're admin/manager
    if (currentUser.role === 'user' && id !== currentUser._id.toString()) {
      return createErrorResponse(res, 403, 'Access denied - can only view own profile');
    }

    const user = await User.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!user) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Non-admin users cannot see inactive users
    if (currentUser.role !== 'admin' && user.status === 'inactive') {
      return createErrorResponse(res, 404, 'User not found');
    }

    createSuccessResponse(res, 200, user.getProfile(), 'User retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve user', error.message);
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user', status = 'active' } = req.body;
    const currentUser = req.user;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return createErrorResponse(res, 400, 'User with this email already exists');
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      status,
      createdBy: currentUser._id,
      updatedBy: currentUser._id
    });

    await user.save();

    // Populate audit fields
    await user.populate('createdBy', 'name email');
    await user.populate('updatedBy', 'name email');

    createSuccessResponse(res, 201, user.getProfile(), 'User created successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to create user', error.message);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    const currentUser = req.user;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Check permissions
    if (currentUser.role === 'user') {
      // Users can only update their own profile (name, email)
      if (id !== currentUser._id.toString()) {
        return createErrorResponse(res, 403, 'Access denied - can only update own profile');
      }
      // Users cannot change their role or status
      if (role || status) {
        return createErrorResponse(res, 403, 'Cannot change role or status');
      }
    } else if (currentUser.role === 'manager') {
      // Managers cannot update admins or other managers
      if (user.role === 'admin' || (user.role === 'manager' && id !== currentUser._id.toString())) {
        return createErrorResponse(res, 403, 'Cannot update admin or other manager profiles');
      }
      // Managers cannot assign admin or manager roles
      if (role === 'admin' || role === 'manager') {
        return createErrorResponse(res, 403, 'Cannot assign admin or manager roles');
      }
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return createErrorResponse(res, 400, 'Email is already taken');
      }
    }

    // Update user
    const updateData = {
      name: name || user.name,
      email: email || user.email,
      updatedBy: currentUser._id
    };

    // Only admins can change roles and status
    if (currentUser.role === 'admin') {
      if (role) updateData.role = role;
      if (status !== undefined) updateData.status = status;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    createSuccessResponse(res, 200, updatedUser.getProfile(), 'User updated successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to update user', error.message);
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Cannot delete yourself
    if (id === currentUser._id.toString()) {
      return createErrorResponse(res, 400, 'Cannot delete your own account');
    }

    // Cannot delete admins (only other admins can delete admins)
    if (user.role === 'admin' && currentUser.role !== 'admin') {
      return createErrorResponse(res, 403, 'Cannot delete admin users');
    }

    // Soft delete by setting status to inactive
    user.status = 'inactive';
    user.updatedBy = currentUser._id;
    await user.save();

    createSuccessResponse(res, 200, null, 'User deactivated successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to delete user', error.message);
  }
};

// Activate user (admin only)
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Update user status
    user.status = 'active';
    user.updatedBy = currentUser._id;
    await user.save();

    await user.populate('createdBy', 'name email');
    await user.populate('updatedBy', 'name email');

    createSuccessResponse(res, 200, user.getProfile(), 'User activated successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to activate user', error.message);
  }
};

// Get user statistics (admin/manager only)
const getUserStatistics = async (req, res) => {
  try {
    const stats = await User.getStatistics();
    
    // Calculate totals
    const totalUsers = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalActive = stats.reduce((sum, stat) => sum + stat.active, 0);
    const totalInactive = stats.reduce((sum, stat) => sum + stat.inactive, 0);

    const statistics = {
      totalUsers,
      totalActive,
      totalInactive,
      byRole: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.active,
          inactive: stat.inactive
        };
        return acc;
      }, {})
    };

    createSuccessResponse(res, 200, statistics, 'User statistics retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve user statistics', error.message);
  }
};

// Reset user password (admin only)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUser = req.user;

    if (!newPassword) {
      return createErrorResponse(res, 400, 'New password is required');
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = currentUser._id;
    await user.save();

    // Clear all refresh tokens (force re-login)
    await user.clearRefreshTokens();

    createSuccessResponse(res, 200, null, 'Password reset successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to reset password', error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUserStatistics,
  resetPassword
};
