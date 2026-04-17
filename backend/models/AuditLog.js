const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'ACTIVATE_USER',
      'DEACTIVATE_USER',
      'LOGIN',
      'LOGOUT',
      'LOGOUT_ALL',
      'CHANGE_PASSWORD',
      'UPDATE_PROFILE',
      'CREATE_ROLE',
      'UPDATE_ROLE',
      'DELETE_ROLE',
      'RESET_PASSWORD'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'role', 'auth', 'profile']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'user']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userEmail: 1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp ? this.timestamp.toLocaleString() : '';
});

// Static method to create audit log entry
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

// Static method to get user activity logs
auditLogSchema.statics.getUserActivity = function(userId, page = 1, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get system activity logs
auditLogSchema.statics.getSystemActivity = function(page = 1, limit = 100, filters = {}) {
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
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get activity statistics
auditLogSchema.statics.getActivityStatistics = function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failureCount: {
          $sum: { $cond: ['$success', 0, 1] }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalActions: { $sum: '$count' },
        totalSuccess: { $sum: '$successCount' },
        totalFailures: { $sum: '$failureCount' },
        actions: {
          $push: {
            action: '$_id',
            count: '$count',
            successCount: '$successCount',
            failureCount: '$failureCount'
          }
        }
      }
    }
  ]);
};

// Static method to get recent failed logins
auditLogSchema.statics.getRecentFailedLogins = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    action: 'LOGIN',
    success: false,
    timestamp: { $gte: since }
  })
  .sort({ timestamp: -1 })
  .limit(100);
};

// Static method to clean old logs (for maintenance)
auditLogSchema.statics.cleanOldLogs = async function(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
