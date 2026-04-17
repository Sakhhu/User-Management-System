const AuditLog = require('../models/AuditLog');
const { createSuccessResponse, createErrorResponse, createPaginatedResponse } = require('../utils/response');

// Get user activity logs
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check permissions
    if (req.user.role === 'user' && userId !== req.user._id.toString()) {
      return createErrorResponse(res, 403, 'Can only view own activity logs');
    }

    const logs = await AuditLog.getUserActivity(userId, page, limit);
    const total = await AuditLog.countDocuments({ userId });

    createPaginatedResponse(res, 200, logs, {
      page,
      limit,
      total
    }, 'User activity logs retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve user activity logs', error.message);
  }
};

// Get system activity logs (admin only)
const getSystemActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const filters = {
      action: req.query.action,
      resource: req.query.resource,
      userEmail: req.query.userEmail,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const logs = await AuditLog.getSystemActivity(page, limit, filters);
    const total = await AuditLog.countDocuments(buildQuery(filters));

    createPaginatedResponse(res, 200, logs, {
      page,
      limit,
      total
    }, 'System activity logs retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve system activity logs', error.message);
  }
};

// Get activity statistics (admin only)
const getActivityStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AuditLog.getActivityStatistics(startDate, endDate);

    createSuccessResponse(res, 200, stats[0] || {
      totalActions: 0,
      totalSuccess: 0,
      totalFailures: 0,
      actions: []
    }, 'Activity statistics retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve activity statistics', error.message);
  }
};

// Get recent failed logins (admin only)
const getRecentFailedLogins = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const logs = await AuditLog.getRecentFailedLogins(hours);

    createSuccessResponse(res, 200, logs, 'Recent failed logins retrieved successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'Failed to retrieve recent failed logins', error.message);
  }
};

// Helper function to build query from filters
const buildQuery = (filters) => {
  const query = {};

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.resource) {
    query.resource = filters.resource;
  }

  if (filters.userEmail) {
    query.userEmail = { $regex: filters.userEmail, $options: 'i' };
  }

  if (filters.startDate && filters.endDate) {
    query.timestamp = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return query;
};

module.exports = {
  getUserActivity,
  getSystemActivity,
  getActivityStatistics,
  getRecentFailedLogins
};
