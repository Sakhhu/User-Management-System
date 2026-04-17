const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { createSuccessResponse, createErrorResponse } = require('../utils/response');

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

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
      createdBy: req.user ? req.user._id : null
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    createSuccessResponse(res, 201, {
      user: user.getProfile(),
      accessToken,
      refreshToken
    }, 'User registered successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Registration failed', error.message);
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      return createErrorResponse(res, 401, 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      return createErrorResponse(res, 401, 'Account is inactive');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return createErrorResponse(res, 401, 'Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    createSuccessResponse(res, 200, {
      user: user.getProfile(),
      accessToken,
      refreshToken
    }, 'Login successful');
  } catch (error) {
    createErrorResponse(res, 500, 'Login failed', error.message);
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return createErrorResponse(res, 401, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) {
      return createErrorResponse(res, 401, 'Invalid refresh token - user not found');
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return createErrorResponse(res, 401, 'Invalid refresh token - token not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      return createErrorResponse(res, 401, 'Account is inactive');
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    createSuccessResponse(res, 200, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }, 'Token refreshed successfully');
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return createErrorResponse(res, 401, 'Invalid refresh token');
    }
    createErrorResponse(res, 500, 'Token refresh failed', error.message);
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return createErrorResponse(res, 400, 'Refresh token is required');
    }

    // Find user and remove refresh token
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      await user.removeRefreshToken(refreshToken);
    }

    createSuccessResponse(res, 200, null, 'Logout successful');
  } catch (error) {
    createErrorResponse(res, 500, 'Logout failed', error.message);
  }
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      await user.clearRefreshTokens();
    }

    createSuccessResponse(res, 200, null, 'Logged out from all devices successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Logout failed', error.message);
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    createSuccessResponse(res, 200, user.getProfile(), 'Profile retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve profile', error.message);
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return createErrorResponse(res, 400, 'Email is already taken');
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        updatedBy: userId
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');

    createSuccessResponse(res, 200, user.getProfile(), 'Profile updated successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to update profile', error.message);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return createErrorResponse(res, 400, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = userId;
    await user.save();

    // Clear all refresh tokens (force re-login on all devices)
    await user.clearRefreshTokens();

    createSuccessResponse(res, 200, null, 'Password changed successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to change password', error.message);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword
};
