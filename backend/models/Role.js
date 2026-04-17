const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    lowercase: true,
    trim: true,
    enum: ['admin', 'manager', 'user']
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    resource: {
      type: String,
      required: true,
      enum: ['users', 'roles', 'profile']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage'],
      required: true
    }]
  }],
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    default: 3 // user = 3, manager = 2, admin = 1
  },
  system: {
    type: Boolean,
    default: false // System roles cannot be deleted
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });

// Pre-save validation
roleSchema.pre('save', function(next) {
  // Ensure permissions are consistent with role level
  if (this.isModified('permissions') || this.isNew) {
    this.validatePermissions();
  }
  next();
});

// Instance method to validate permissions
roleSchema.methods.validatePermissions = function() {
  const rolePermissions = {
    admin: {
      users: ['create', 'read', 'update', 'delete', 'manage'],
      roles: ['create', 'read', 'update', 'delete', 'manage'],
      profile: ['read', 'update']
    },
    manager: {
      users: ['read', 'update'],
      roles: ['read'],
      profile: ['read', 'update']
    },
    user: {
      users: ['read'], // Only read own profile
      roles: [],
      profile: ['read', 'update']
    }
  };

  const expectedPermissions = rolePermissions[this.name];
  if (!expectedPermissions) {
    return false;
  }

  // Check if permissions match expected structure
  for (const [resource, actions] of Object.entries(expectedPermissions)) {
    const rolePermission = this.permissions.find(p => p.resource === resource);
    if (!rolePermission && actions.length > 0) {
      return false;
    }
    if (rolePermission) {
      const roleActions = rolePermission.actions.sort();
      const expectedActions = actions.sort();
      if (JSON.stringify(roleActions) !== JSON.stringify(expectedActions)) {
        return false;
      }
    }
  }

  return true;
};

// Instance method to check permission
roleSchema.methods.hasPermission = function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

// Static method to initialize default roles
roleSchema.statics.initializeDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'admin',
      description: 'Full system administrator with all permissions',
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'roles', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'profile', actions: ['read', 'update'] }
      ],
      level: 1,
      system: true
    },
    {
      name: 'manager',
      description: 'Manager with limited administrative capabilities',
      permissions: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'roles', actions: ['read'] },
        { resource: 'profile', actions: ['read', 'update'] }
      ],
      level: 2,
      system: true
    },
    {
      name: 'user',
      description: 'Regular user with basic profile access',
      permissions: [
        { resource: 'users', actions: ['read'] }, // Can read own profile
        { resource: 'profile', actions: ['read', 'update'] }
      ],
      level: 3,
      system: true
    }
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    if (!existingRole) {
      await this.create(roleData);
      console.log(`Created default role: ${roleData.name}`);
    }
  }
};

// Static method to get role by name
roleSchema.statics.getByName = function(name) {
  return this.findOne({ name: name.toLowerCase() });
};

// Static method to check if role exists
roleSchema.statics.roleExists = function(name) {
  return this.exists({ name: name.toLowerCase() });
};

module.exports = mongoose.model('Role', roleSchema);
